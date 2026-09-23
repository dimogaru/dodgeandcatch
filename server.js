const express = require("express");
const path = require("node:path");
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

app.disable("x-powered-by");
app.use(express.json({ limit: "8kb" }));

const publicFile = (fileName) => path.join(__dirname, fileName);
let databaseReady = false;

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ranking (
      id SERIAL PRIMARY KEY,
      nick VARCHAR(10) NOT NULL,
      score INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Preserve scores from the previous PostgreSQL table when upgrading this
  // workspace. Fresh Hetzner databases simply skip this compatibility step.
  const legacyTable = await pool.query(
    "SELECT to_regclass('public.dodge_catch_scores') AS table_name"
  );
  if (legacyTable.rows[0].table_name) {
    const currentRows = await pool.query("SELECT COUNT(*)::int AS count FROM ranking");
    if (currentRows.rows[0].count === 0) {
      await pool.query(`
        INSERT INTO ranking (nick, score, created_at)
        SELECT nickname, score, created_at
        FROM dodge_catch_scores
      `);
    }
  }
}

const databaseInitialization = initializeDatabase()
  .then(() => {
    databaseReady = true;
    console.log("PostgreSQL ready: ranking table available");
  })
  .catch((error) => {
    console.error("PostgreSQL initialization failed:", error.message);
  });

async function requireDatabase(response) {
  await databaseInitialization;
  if (databaseReady) return true;
  response.status(503).json({ error: "La base de datos no está disponible." });
  return false;
}

app.get("/api/ranking", async (_request, response) => {
  if (!(await requireDatabase(response))) return;
  try {
    const result = await pool.query(
      `SELECT nick AS nickname, score
       FROM ranking
       ORDER BY score DESC, created_at ASC
       LIMIT 20`
    );
    response.json(result.rows);
  } catch (error) {
    console.error("Ranking GET failed:", error);
    response.status(500).json({ error: "No se pudo cargar el ranking global." });
  }
});

app.post("/api/ranking", async (request, response) => {
  const body = request.body && typeof request.body === "object" ? request.body : {};
  const nickname = normalizeNickname(body.nickname);
  const score = Number(body.score);

  if (!nickname) {
    return response.status(400).json({ error: "El apodo es obligatorio." });
  }
  if (!Number.isInteger(score) || score < 0 || score > 2147483647) {
    return response.status(400).json({ error: "La puntuación no es válida." });
  }
  if (!(await requireDatabase(response))) return;

  try {
    await pool.query(
      `INSERT INTO ranking (nick, score)
       VALUES ($1, $2)`,
      [nickname, score]
    );
    const ranking = await pool.query(
      `SELECT nick AS nickname, score
       FROM ranking
       ORDER BY score DESC, created_at ASC
       LIMIT 20`
    );
    response.status(201).json({ saved: { nickname, score }, ranking: ranking.rows });
  } catch (error) {
    console.error("Ranking POST failed:", error);
    response.status(500).json({ error: "No se pudo guardar la puntuación." });
  }
});

app.get(["/", "/index.html"], (_request, response) => {
  response.sendFile(publicFile("index.html"));
});

app.get("/manifest.json", (_request, response) => {
  response.sendFile(publicFile("manifest.json"));
});

app.get("/sw.js", (_request, response) => {
  response.sendFile(publicFile("sw.js"));
});

app.get("/icon.svg", (_request, response) => {
  response.type("image/svg+xml").sendFile(publicFile("icon.svg"));
});

function normalizeNickname(value) {
  if (typeof value !== "string") return "";
  return Array.from(value)
    .join("")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 10);
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dodge & Catch server listening on 0.0.0.0:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  await pool.end();
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));