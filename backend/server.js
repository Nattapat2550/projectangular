require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const Busboy = require('busboy');
const { connect, getDb, getBucket, ObjectId } = require('./db');
const { pickVideoContentType, sanitizeText } = require('./utils/validate');

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'videosdb';

// Serve static frontend
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Connect DB before listening
connect(MONGODB_URI, DB_NAME).then(() => {
  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
}).catch((e) => {
  console.error('DB connect error:', e);
  process.exit(1);
});

// ==== Video APIs ==== //

// List videos (with basic filtering/pagination)
app.get('/api/videos', async (req, res) => {
  try {
    const db = getDb();
    const { visibility = 'public', q = '', page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};
    if (visibility) filter['metadata.visibility'] = visibility; // 'public' | 'private'
    if (q) filter.$or = [
      { filename: { $regex: q, $options: 'i' } },
      { 'metadata.title': { $regex: q, $options: 'i' } },
      { 'metadata.tags': { $elemMatch: { $regex: q, $options: 'i' } } }
    ];

    const filesCol = db.collection('videos.files');
    const cursor = filesCol.find(filter, { projection: {
      length: 1, chunkSize: 1, uploadDate: 1, filename: 1,
      metadata: 1, contentType: 1
    }}).sort({ uploadDate: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);

    const items = await cursor.toArray();
    const total = await filesCol.countDocuments(filter);
    res.json({ items, total, page: pageNum, limit: pageSize });
  } catch (err) {
    console.error('[list videos] error:', err);
    res.status(500).json({ error: 'Failed to list videos', detail: String(err?.message || err) });
  }
});

// Upload video (streaming, no buffering in memory)
app.post('/api/videos', (req, res) => {
  try {
    // ✅ Busboy v1.x ใช้แบบฟังก์ชัน ไม่ต้อง new
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2GB cap
    const bucket = getBucket();

    let meta = { title: '', description: '', visibility: 'public', tags: [], posterUrl: '' };
    let hasFile = false;
    let fileId = null;

    busboy.on('field', (name, val) => {
      if (name === 'title') meta.title = sanitizeText(val, 200);
      if (name === 'description') meta.description = sanitizeText(val, 1000);
      if (name === 'visibility') meta.visibility = (val === 'private') ? 'private' : 'public';
      if (name === 'tags') meta.tags = sanitizeText(val, 200).split(',').map(s => s.trim()).filter(Boolean);
      if (name === 'posterUrl') meta.posterUrl = sanitizeText(val, 400);
    });

    // Busboy v1: info = { filename, mimeType, encoding }
    busboy.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      const contentType = pickVideoContentType(filename, mimeType);

      // ✅ allow only video types
      if (!/^video\//.test(contentType)) {
        file.resume();
        return res.status(400).json({ error: 'Only video files are allowed' });
      }

      hasFile = true;

      const uploadStream = bucket.openUploadStream(filename, {
        contentType,
        metadata: meta
      });

      fileId = uploadStream.id;
      file.pipe(uploadStream);

      uploadStream.on('error', (err) => {
        console.error('Upload error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Upload failed' });
      });

      uploadStream.on('finish', () => {
        if (!res.headersSent) res.status(201).json({ id: uploadStream.id, filename, contentType, metadata: meta });
      });
    });

    busboy.on('close', () => {
      if (!hasFile) {
        if (!res.headersSent) res.status(400).json({ error: 'No file uploaded' });
      }
    });

    req.pipe(busboy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unexpected upload error' });
  }
});

// Stream video with HTTP Range support
app.get('/api/videos/:id/stream', async (req, res) => {
  try {
    const { id } = req.params;
    const _id = new ObjectId(id);
    const db = getDb();

    const filesCol = db.collection('videos.files');
    const fileDoc = await filesCol.findOne({ _id });
    if (!fileDoc) return res.status(404).json({ error: 'Not found' });

    const fileSize = fileDoc.length; // bytes
    const range = req.headers.range;
    const contentType = fileDoc.contentType || 'application/octet-stream';

    if (!range) {
      // No range: stream full
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes'
      });
      const download = getBucket().openDownloadStream(_id);
      return download.pipe(res);
    }

    // Parse Range: e.g., bytes=0- or bytes=1000-2000
    const positions = range.replace(/bytes=/, '').split('-');
    let start = parseInt(positions[0], 10);
    let end = positions[1] ? parseInt(positions[1], 10) : fileSize - 1;
    if (isNaN(start)) start = 0;
    if (isNaN(end) || end > fileSize - 1) end = fileSize - 1;

    const chunkSize = (end - start) + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType
    });

    const download = getBucket().openDownloadStream(_id, { start, end: end + 1 });
    download.pipe(res);
  } catch (err) {
    console.error('Stream error:', err);
    res.status(500).json({ error: 'Stream error' });
  }
});

// Get metadata for a single video
app.get('/api/videos/:id', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const doc = await getDb().collection('videos.files').findOne({ _id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

// Update metadata (title, description, visibility, tags, posterUrl)
app.patch('/api/videos/:id', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const allowed = ['title', 'description', 'visibility', 'tags', 'posterUrl'];
    const set = {};
    for (const key of allowed) {
      if (key in req.body) {
        if (key === 'tags' && Array.isArray(req.body.tags)) set[`metadata.${key}`] = req.body.tags.slice(0, 20);
        else set[`metadata.${key}`] = sanitizeText(req.body[key], key === 'description' ? 1000 : 400);
      }
    }
    const r = await getDb().collection('videos.files').updateOne({ _id }, { $set: set });
    res.json({ ok: true, modifiedCount: r.modifiedCount });
  } catch (e) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    await getBucket().delete(_id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Invalid id or delete failed' });
  }
});
