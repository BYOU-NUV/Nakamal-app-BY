const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const request = require("supertest");
const { newDb, DataType } = require("pg-mem");
const { createApp } = require("../app");

async function buildTestApp() {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: "to_char",
    args: [DataType.time, DataType.text],
    returns: DataType.text,
    implementation(value, format) {
      if (value == null) return null;
      if (format === "HH24:MI") return String(value).slice(0, 5);
      return String(value);
    }
  });

  const { Pool } = db.adapters.createPg();
  const pool = new Pool();

  const schemaPath = path.join(__dirname, "..", "db", "01_schema.sql");
  let schemaSql = fs.readFileSync(schemaPath, "utf8");
  schemaSql = schemaSql.replace(/CREATE OR REPLACE FUNCTION[\s\S]*?COMMIT;/m, "COMMIT;");
  await pool.query(schemaSql);

  const app = createApp({ pool, allowedOrigins: [] });
  return { app, pool };
}

test("health and CRUD flow works", async () => {
  const { app, pool } = await buildTestApp();

  await request(app)
    .get("/api/health")
    .expect(200)
    .expect(res => assert.equal(res.body.ok, true));

  const createRes = await request(app)
    .post("/api/nakamals")
    .send({
      name: "Blue Lagoon Nakamal",
      google_maps_link: "https://maps.google.com/?q=blue",
      opening_time: "17:00",
      closing_time: "22:00",
      alcohol_available: true,
      kakai_available: false,
      kava_windows_count: 3,
      rate: 4.5,
      photo_urls: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg"
      ]
    })
    .expect(201);

  assert.ok(createRes.body.id);

  const listRes = await request(app).get("/api/nakamals").expect(200);
  assert.equal(listRes.body.nakamals.length, 1);
  assert.equal(listRes.body.nakamals[0].name, "Blue Lagoon Nakamal");
  assert.equal(listRes.body.nakamals[0].cover_photo_url, "https://example.com/photo1.jpg");

  await request(app)
    .post(`/api/nakamals/${createRes.body.id}/comments`)
    .send({ nickname: "Ben", comment_text: "Nice place" })
    .expect(201);

  await request(app)
    .post(`/api/nakamals/${createRes.body.id}/photos`)
    .send({ photo_url: "https://example.com/photo3.jpg", caption: "Night view" })
    .expect(201);

  const detailRes = await request(app)
    .get(`/api/nakamals/${createRes.body.id}`)
    .expect(200);

  assert.equal(detailRes.body.nakamal.comments.length, 1);
  assert.equal(detailRes.body.nakamal.photos.length, 3);
  assert.equal(detailRes.body.nakamal.comments[0].nickname, "Ben");

  await pool.end();
});

test("validation errors are returned cleanly", async () => {
  const { app, pool } = await buildTestApp();

  await request(app)
    .post("/api/nakamals")
    .send({ name: "" })
    .expect(400)
    .expect(res => assert.equal(res.body.error, "Name is required."));

  await request(app)
    .post("/api/nakamals/999/comments")
    .send({ nickname: "A", comment_text: "Hello" })
    .expect(404)
    .expect(res => assert.equal(res.body.error, "Nakamal not found."));

  await request(app)
    .post("/api/nakamals")
    .send({ name: "Bad Count", kava_windows_count: -1 })
    .expect(400)
    .expect(res => assert.match(res.body.error, /validation/i));

  await pool.end();
});
