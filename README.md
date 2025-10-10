# MongoDB GridFS Video Uploader & Player

## Features
- Upload videos into MongoDB GridFS (streamed)
- Metadata (title, description, visibility, tags, poster)
- List videos with search & filter
- Watch with HTTP Range support
- Edit metadata, delete
- Vanilla HTML/CSS/JS frontend
- One service deploy (serves frontend via Express)

## Setup
1. Create a MongoDB database & get connection string.
2. Fill `.env` in `backend/` with `MONGODB_URI`, `DB_NAME` (copy `.env.example`).
3. `npm i && npm start` inside `backend/`.
4. Open `http://localhost:8080`.

## Deploy (Render)
- Create Web Service → Root: `project/backend` → Start: `node server.js`.
- Set env vars in **Environment**.
