const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const visEl = document.getElementById('visibilityFilter');
const refreshBtn = document.getElementById('refreshBtn');
const uploadForm = document.getElementById('uploadForm');
const uploadMsg = document.getElementById('uploadMsg');

const dlg = document.getElementById('playerDialog');
const closeDialogBtn = document.getElementById('closeDialog');
const dlgTitle = document.getElementById('dlgTitle');
const dlgDesc = document.getElementById('dlgDesc');
const dlgVideo = document.getElementById('dlgVideo');
const openWatch = document.getElementById('openWatch');
const deleteBtn = document.getElementById('deleteBtn');

// Progress UI
const progressRow = document.getElementById('uploadProgressRow');
const progressBar = document.getElementById('uploadProgress');
const progressPercent = document.getElementById('uploadPercent');
const progressSpeed = document.getElementById('uploadSpeed');
const progressEta = document.getElementById('uploadEta');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');

let currentId = null;
let currentXHR = null;

async function fetchList() {
  const q = encodeURIComponent(searchEl.value || '');
  const visibility = encodeURIComponent(visEl.value || 'public');
  const res = await fetch(`/api/videos?visibility=${visibility}&q=${q}`);
  const data = await res.json();
  renderList(data.items || []);
}

function renderList(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = '<p class="muted">No videos</p>';
    return;
  }
  for (const f of items) {
    const div = document.createElement('div');
    div.className = 'item';
    const title = f.metadata?.title || f.filename;
    const poster = f.metadata?.posterUrl || '';

    div.innerHTML = `
      <div class="thumb">${poster ? `<img src="${poster}" alt="thumb" style="width:100%;height:100%;object-fit:cover">` : 'No Poster'}</div>
      <div class="meta">
        <strong title="${title}">${title}</strong>
        <div class="row">
          <a class="button" href="/watch.html?id=${f._id}" target="_blank">Watch</a>
          <button class="button" data-play="${f._id}">Play here</button>
        </div>
        <div class="muted">${new Date(f.uploadDate).toLocaleString()}</div>
      </div>`;

    div.querySelector('[data-play]')?.addEventListener('click', () => openDialog(f));
    listEl.appendChild(div);
  }
}

function openDialog(file) {
  currentId = file._id;
  dlgTitle.textContent = file.metadata?.title || file.filename;
  dlgDesc.textContent = file.metadata?.description || '';
  dlgVideo.src = `/api/videos/${file._id}/stream`;
  if (file.metadata?.posterUrl) dlgVideo.setAttribute('poster', file.metadata.posterUrl);
  openWatch.href = `/watch.html?id=${file._id}`;
  dlg.showModal();
}

closeDialogBtn?.addEventListener('click', () => {
  dlg.close();
  dlgVideo.pause();
  dlgVideo.removeAttribute('src');
  dlgVideo.load();
});

deleteBtn?.addEventListener('click', async () => {
  if (!currentId) return;
  if (!confirm('Delete this video?')) return;
  const res = await fetch(`/api/videos/${currentId}`, { method: 'DELETE' });
  if (res.ok) { dlg.close(); fetchList(); }
});

refreshBtn?.addEventListener('click', fetchList);
searchEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') fetchList(); });
visEl?.addEventListener('change', fetchList);

// -------------------- Upload with Progress --------------------
function humanBytes(n) {
  if (!Number.isFinite(n)) return '0 B';
  const u = ['B','KB','MB','GB','TB'];
  let i = 0; while (n >= 1024 && i < u.length-1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)} ${u[i]}`;
}
function fmtETA(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'ETA --:--';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `ETA ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function resetProgress() {
  progressBar.value = 0;
  progressPercent.textContent = '0%';
  progressSpeed.textContent = '0 MB/s';
  progressEta.textContent = 'ETA --:--';
  progressRow.style.display = 'none';
}

uploadForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (currentXHR) { currentXHR.abort(); currentXHR = null; } // cancel any previous

  const fd = new FormData(uploadForm);
  const file = fd.get('file');
  if (!file || !(file instanceof File)) {
    uploadMsg.textContent = 'Please choose a video file';
    return;
  }

  uploadMsg.textContent = 'Uploading...';
  progressRow.style.display = 'flex';
  progressBar.value = 0;
  progressPercent.textContent = '0%';
  progressSpeed.textContent = '0 MB/s';
  progressEta.textContent = 'ETA --:--';

  const xhr = new XMLHttpRequest();
  currentXHR = xhr;

  let startTime = Date.now();
  let lastLoaded = 0;

  xhr.upload.onprogress = (ev) => {
    // ev.lengthComputable may be false onบางเบราว์เซอร์/เครือข่าย
    if (ev.lengthComputable) {
      const percent = Math.round((ev.loaded / ev.total) * 100);
      progressBar.value = percent;
      progressPercent.textContent = percent + '%';

      const now = Date.now();
      const deltaBytes = ev.loaded - lastLoaded;
      const deltaTime = (now - startTime) / 1000; // sec since start
      const instSpeed = deltaBytes / ((now - (startTime + deltaTime*1000 - (now - startTime))) || 1000); // fallback
      // ใช้ speed เฉลี่ยตั้งแต่เริ่ม (เสถียรกว่า)
      const avgSpeed = ev.loaded / Math.max((now - startTime) / 1000, 0.001);
      progressSpeed.textContent = humanBytes(avgSpeed) + '/s';

      const remaining = ev.total - ev.loaded;
      const etaSec = remaining / Math.max(avgSpeed, 1);
      progressEta.textContent = fmtETA(etaSec);

      lastLoaded = ev.loaded;
    } else {
      // ไม่รู้ขนาดไฟล์ => ทำเป็น indeterminate โดยโชว์ % = ไม้วิ่ง (จำลอง)
      progressBar.removeAttribute('value');
      progressPercent.textContent = '...';
      progressSpeed.textContent = '...';
      progressEta.textContent = 'ETA --:--';
    }
  };

  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      currentXHR = null;
      // คืน progress bar ให้เต็ม 100% ถ้าสำเร็จ
      if (xhr.status >= 200 && xhr.status < 300) {
        progressBar.value = 100;
        progressPercent.textContent = '100%';
        uploadMsg.textContent = 'Uploaded!';
        uploadForm.reset();
        setTimeout(resetProgress, 700); // เก็บให้เห็นแป๊บหนึ่ง
        fetchList();
      } else {
        uploadMsg.textContent = `Upload failed: ${xhr.responseText || xhr.status}`;
        resetProgress();
      }
    }
  };

  xhr.onerror = () => {
    currentXHR = null;
    uploadMsg.textContent = 'Upload error (network)';
    resetProgress();
  };

  cancelUploadBtn.onclick = () => {
    if (currentXHR) {
      currentXHR.abort();
      uploadMsg.textContent = 'Upload canceled';
      resetProgress();
    }
  };

  xhr.open('POST', '/api/videos');
  xhr.send(fd);
});

fetchList();
