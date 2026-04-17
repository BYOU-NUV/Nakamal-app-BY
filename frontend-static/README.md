# Frontend Static Site

This frontend is designed for **Render Static Site**.

## Files
- `index.html`
- `styles.css`
- `app.js`
- `config.js`

## Important config
Edit `config.js` before deployment or after your backend is deployed:

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://your-backend-name.onrender.com/api"
};
```

## Render deployment
Create a **Static Site** on Render and point it to this folder.

Suggested settings:
- **Build Command:** leave empty
- **Publish Directory:** `.`

If you update `config.js`, commit and push again so Render rebuilds the static site.
