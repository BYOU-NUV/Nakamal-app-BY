# Nakamal Render App

This package contains:
- `frontend-static/` → Render Static Site
- `backend-api/` → Render Web Service (Node.js + Express)
- `database/` → PostgreSQL schema scripts

## Recommended deployment order
1. Create the PostgreSQL database on Render.
2. Run `database/01_schema.sql`.
3. Deploy `backend-api/` as a Render Web Service.
4. Set the backend environment variables:
   - `DATABASE_URL`
   - `DATABASE_SSL`
   - `FRONTEND_ORIGIN`
5. Deploy `frontend-static/` as a Render Static Site.
6. Edit `frontend-static/config.js` so `API_BASE_URL` points to your deployed backend:
   - Example: `https://your-backend-name.onrender.com/api`

## Future-ready architecture
The schema already includes `status` fields (`published`, `pending`, `archived`) so you can add moderation later without redesigning the database.
