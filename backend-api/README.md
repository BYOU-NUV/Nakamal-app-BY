# Backend API

This backend is designed for a **Render Web Service** using Node.js and Express.

## Files
- `app.js`
- `db.js`
- `server.js`
- `db/01_schema.sql`
- `package.json`
- `.env.example`
- `test/api.test.js`

## What changed in this verified version
- The API now **auto-runs the schema** on startup by default.
- The backend now has an **automated test suite**.
- The app code is split so the API can be tested without starting a real HTTP server.

## Local run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and update values.
3. Start:
   ```bash
   npm start
   ```

## Local tests
```bash
npm test
```

## Render deployment
Create a **Web Service** on Render and point it to this folder.

Suggested settings:
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

Add these environment variables in Render:
- `DATABASE_URL` = your Render Postgres internal database URL
- `DATABASE_SSL` = `false` for the internal URL in most Render setups
- `AUTO_RUN_MIGRATIONS` = `true`
- `FRONTEND_ORIGIN` = optional, for stricter CORS later

## Main API routes
- `GET /api/health`
- `GET /api/nakamals`
- `GET /api/nakamals/:id`
- `POST /api/nakamals`
- `GET /api/nakamals/:id/comments`
- `POST /api/nakamals/:id/comments`
- `GET /api/nakamals/:id/photos`
- `POST /api/nakamals/:id/photos`
