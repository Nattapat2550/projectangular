function pickVideoContentType(filename, fallback) {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.ogg') || lower.endsWith('.ogv')) return 'video/ogg';
  return fallback || 'application/octet-stream';
}

function sanitizeText(s, max = 200) {
  return String(s || '').trim().slice(0, max);
}

module.exports = { pickVideoContentType, sanitizeText };
