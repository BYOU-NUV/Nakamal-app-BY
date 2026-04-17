# Backend API

This backend is designed for a **Render Web Service** using Node.js and Express.

## Files
- `server.js`
- `package.json`
- `.env.example`

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

## Render deployment
Create a **Web Service** on Render and point it to this folder.

Suggested settings:
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`

Add these environment variables in Render:
- `DATABASE_URL` = your Render Postgres internal database URL
- `DATABASE_SSL` = `true` or `false`
- `FRONTEND_ORIGIN` = your Render Static Site URL

## Main API routes
- `GET /api/health`
- `GET /api/nakamals`
- `GET /api/nakamals/:id`
- `POST /api/nakamals`
- `GET /api/nakamals/:id/comments`
- `POST /api/nakamals/:id/comments`
- `GET /api/nakamals/:id/photos`
- `POST /api/nakamals/:id/photos`
