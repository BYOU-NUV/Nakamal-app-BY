require("dotenv").config();

const path = require("node:path");
const { createApp } = require("./app");
const { createPool, getAllowedOrigins, runMigrations } = require("./db");

const PORT = process.env.PORT || 3000;
const pool = createPool();
const app = createApp({
  pool,
  allowedOrigins: getAllowedOrigins()
});

async function start() {
  try {
    const shouldAutoMigrate = process.env.AUTO_RUN_MIGRATIONS !== "false";
    if (shouldAutoMigrate) {
      await runMigrations(pool, path.join(__dirname, "db", "01_schema.sql"));
      console.log("Database schema is ready.");
    }

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
