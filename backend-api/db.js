const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("pg");

function getAllowedOrigins() {
  return (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
}

function buildPgConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
    };
  }

  return {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "nakamal_app",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    ssl: false
  };
}

function createPool() {
  return new Pool(buildPgConfig());
}

async function runMigrations(pool, schemaPath = path.join(__dirname, "db", "01_schema.sql")) {
  const sql = await fs.readFile(schemaPath, "utf8");
  await pool.query(sql);
}

module.exports = {
  buildPgConfig,
  createPool,
  getAllowedOrigins,
  runMigrations
};
