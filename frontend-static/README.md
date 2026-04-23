# Frontend Static Site

This frontend is designed for a **Render Static Site**.

## What changed in this verified version
- Added a small **build step** that generates `dist/config.js` from the environment variable `FRONTEND_API_BASE_URL`.
- You no longer need to edit the built files by hand before every deploy.

## Files
- `index.html`
- `styles.css`
- `app.js`
- `config.js` (local fallback)
- `config.example.js`
- `build.mjs`
- `package.json`

## Local preview
You can serve this folder with any simple static server.
For example:
```bash
python -m http.server 8080
```
Then update `config.js` if needed.

## Build for Render
```bash
npm install
FRONTEND_API_BASE_URL=https://your-backend.onrender.com/api npm run build
```

Render settings:
- **Environment:** Static Site
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:** `FRONTEND_API_BASE_URL`
