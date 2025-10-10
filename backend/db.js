const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

let client, db, bucket;

async function connect(uri, dbName) {
  if (db) return { db, bucket };
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  bucket = new GridFSBucket(db, { bucketName: 'videos' });
  // Indexes for better query performance
  await db.collection('videos.files').createIndex({ filename: 1, uploadDate: -1 });
  await db.collection('videos.files').createIndex({ 'metadata.visibility': 1 });
  return { db, bucket };
}

function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}
function getBucket() {
  if (!bucket) throw new Error('Bucket not initialized');
  return bucket;
}

module.exports = { connect, getDb, getBucket, ObjectId };
