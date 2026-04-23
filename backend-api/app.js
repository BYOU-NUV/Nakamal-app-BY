const express = require("express");
const cors = require("cors");

function createApp({ pool, allowedOrigins = [] }) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS."));
    }
  }));

  app.get("/", (req, res) => {
    res.json({
      name: "nakamal-api",
      status: "ok",
      docs: "/api/health"
    });
  });

  app.get("/api/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ ok: true, database: "connected" });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ ok: false, error: "Database connection failed." });
    }
  });

  app.get("/api/nakamals", async (req, res, next) => {
    try {
      const sql = `
        SELECT
          n.id,
          n.name,
          n.google_maps_link,
          to_char(n.opening_time, 'HH24:MI') AS opening_time,
          to_char(n.closing_time, 'HH24:MI') AS closing_time,
          n.alcohol_available,
          n.kakai_available,
          n.kava_windows_count,
          n.rate,
          n.created_at,
          cover.photo_url AS cover_photo_url
        FROM nakamals n
        LEFT JOIN (
          SELECT nakamal_id, MIN(id) AS first_photo_id
          FROM nakamal_photos
          WHERE status = 'published'
          GROUP BY nakamal_id
        ) cover_index ON cover_index.nakamal_id = n.id
        LEFT JOIN nakamal_photos cover ON cover.id = cover_index.first_photo_id
        WHERE n.status = 'published'
        ORDER BY lower(n.name) ASC, n.created_at DESC;
      `;
      const { rows } = await pool.query(sql);
      res.json({ nakamals: rows });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/nakamals/:id", async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid nakamal id." });
    }

    try {
      const nakamalResult = await pool.query(`
        SELECT
          id,
          name,
          google_maps_link,
          to_char(opening_time, 'HH24:MI') AS opening_time,
          to_char(closing_time, 'HH24:MI') AS closing_time,
          alcohol_available,
          kakai_available,
          kava_windows_count,
          rate,
          created_at
        FROM nakamals
        WHERE id = $1 AND status = 'published'
        LIMIT 1;
      `, [id]);

      if (!nakamalResult.rowCount) {
        return res.status(404).json({ error: "Nakamal not found." });
      }

      const commentsResult = await pool.query(`
        SELECT id, nickname, comment_text, created_at
        FROM nakamal_comments
        WHERE nakamal_id = $1 AND status = 'published'
        ORDER BY created_at DESC;
      `, [id]);

      const photosResult = await pool.query(`
        SELECT id, photo_url, caption, created_at
        FROM nakamal_photos
        WHERE nakamal_id = $1 AND status = 'published'
        ORDER BY created_at ASC;
      `, [id]);

      res.json({
        nakamal: {
          ...nakamalResult.rows[0],
          comments: commentsResult.rows,
          photos: photosResult.rows
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/nakamals/:id/comments", async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid nakamal id." });
    }

    try {
      const { rows } = await pool.query(`
        SELECT id, nickname, comment_text, created_at
        FROM nakamal_comments
        WHERE nakamal_id = $1 AND status = 'published'
        ORDER BY created_at DESC;
      `, [id]);
      res.json({ comments: rows });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/nakamals/:id/photos", async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid nakamal id." });
    }

    try {
      const { rows } = await pool.query(`
        SELECT id, photo_url, caption, created_at
        FROM nakamal_photos
        WHERE nakamal_id = $1 AND status = 'published'
        ORDER BY created_at ASC;
      `, [id]);
      res.json({ photos: rows });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/nakamals", async (req, res, next) => {
    const {
      name,
      google_maps_link = null,
      opening_time = null,
      closing_time = null,
      alcohol_available = null,
      kakai_available = null,
      kava_windows_count = null,
      rate = null,
      photo_urls = []
    } = req.body || {};

    if (!name || String(name).trim() === "") {
      return res.status(400).json({ error: "Name is required." });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const insertResult = await client.query(`
        INSERT INTO nakamals (
          name,
          google_maps_link,
          opening_time,
          closing_time,
          alcohol_available,
          kakai_available,
          kava_windows_count,
          rate,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published')
        RETURNING id;
      `, [
        String(name).trim(),
        normalizeNullableString(google_maps_link),
        normalizeNullableString(opening_time),
        normalizeNullableString(closing_time),
        normalizeNullableBoolean(alcohol_available),
        normalizeNullableBoolean(kakai_available),
        normalizeNullableInteger(kava_windows_count),
        normalizeNullableNumber(rate)
      ]);

      const nakamalId = insertResult.rows[0].id;

      for (const rawUrl of Array.isArray(photo_urls) ? photo_urls : []) {
        const photoUrl = normalizeNullableString(rawUrl);
        if (!photoUrl) continue;
        await client.query(`
          INSERT INTO nakamal_photos (nakamal_id, photo_url, status)
          VALUES ($1, $2, 'published');
        `, [nakamalId, photoUrl]);
      }

      await client.query("COMMIT");
      res.status(201).json({ message: "Nakamal created.", id: nakamalId });
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  });

  app.post("/api/nakamals/:id/comments", async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid nakamal id." });
    }

    const { nickname = null, comment_text = null } = req.body || {};
    if (!comment_text || String(comment_text).trim() === "") {
      return res.status(400).json({ error: "Comment text is required." });
    }

    try {
      await ensureNakamalExists(pool, id);
      const { rows } = await pool.query(`
        INSERT INTO nakamal_comments (nakamal_id, nickname, comment_text, status)
        VALUES ($1, $2, $3, 'published')
        RETURNING id, nickname, comment_text, created_at;
      `, [
        id,
        normalizeNullableString(nickname) || "Anonymous",
        String(comment_text).trim()
      ]);

      res.status(201).json({ message: "Comment added.", comment: rows[0] });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/nakamals/:id/photos", async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid nakamal id." });
    }

    const { photo_url = null, caption = null } = req.body || {};
    if (!photo_url || String(photo_url).trim() === "") {
      return res.status(400).json({ error: "Photo URL is required." });
    }

    try {
      await ensureNakamalExists(pool, id);
      const { rows } = await pool.query(`
        INSERT INTO nakamal_photos (nakamal_id, photo_url, caption, status)
        VALUES ($1, $2, $3, 'published')
        RETURNING id, photo_url, caption, created_at;
      `, [
        id,
        String(photo_url).trim(),
        normalizeNullableString(caption)
      ]);

      res.status(201).json({ message: "Photo added.", photo: rows[0] });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, req, res, next) => {
    if (error.message === "NAKAMAL_NOT_FOUND") {
      return res.status(404).json({ error: "Nakamal not found." });
    }
    if (
      error.code === "23514" ||
      /constraint/i.test(error.message || "") ||
      /validation rule/i.test(error.message || "")
    ) {
      return res.status(400).json({ error: "One of the values failed a database validation rule." });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  });

  return app;
}

async function ensureNakamalExists(pool, id) {
  const result = await pool.query(`
    SELECT id
    FROM nakamals
    WHERE id = $1 AND status = 'published'
    LIMIT 1;
  `, [id]);

  if (!result.rowCount) {
    throw new Error("NAKAMAL_NOT_FOUND");
  }
}

function normalizeNullableString(value) {
  if (value === null || value === undefined) return null;
  const output = String(value).trim();
  return output === "" ? null : output;
}

function normalizeNullableBoolean(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function normalizeNullableInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const output = Number.parseInt(value, 10);
  return Number.isNaN(output) ? null : output;
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const output = Number.parseFloat(value);
  return Number.isNaN(output) ? null : output;
}

module.exports = { createApp };
