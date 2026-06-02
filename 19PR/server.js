const express = require("express");
const { pool, initDb, findUserById, USER_SELECT_COLUMNS } = require("./db");

require("dotenv").config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 3000;
const SORT_FIELDS = new Set(["id", "first_name", "last_name", "age", "created_at"]);

function parseAge(value) {
  const age = Number(value);
  if (!Number.isInteger(age) || age < 0) {
    return null;
  }
  return age;
}

function validateUserPayload(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body.first_name !== undefined) {
    const value = String(body.first_name || "").trim();
    if (!value) {
      errors.push("first_name is required");
    } else {
      data.first_name = value;
    }
  }

  if (!partial || body.last_name !== undefined) {
    const value = String(body.last_name || "").trim();
    if (!value) {
      errors.push("last_name is required");
    } else {
      data.last_name = value;
    }
  }

  if (!partial || body.age !== undefined) {
    const age = parseAge(body.age);
    if (age === null) {
      errors.push("age must be a non-negative integer");
    } else {
      data.age = age;
    }
  }

  return { data, errors };
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", practice: 19, database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: error.message });
  }
});

app.get("/", (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Практика 19</title>
      </head>
      <body>
        <main>
          <h1>Практика 19</h1>
          <p>CRUD API пользователей на Express и PostgreSQL.</p>
          <ul>
            <li><a href="/health">/health</a></li>
            <li><a href="/api/users">/api/users</a></li>
          </ul>
        </main>
      </body>
    </html>
  `);
});

app.post("/api/users", async (req, res) => {
  const { data, errors } = validateUserPayload(req.body || {});
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const { rows } = await pool.query(
      `
        INSERT INTO users (first_name, last_name, age)
        VALUES ($1, $2, $3)
        RETURNING ${USER_SELECT_COLUMNS}
      `,
      [data.first_name, data.last_name, data.age]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  const sort = SORT_FIELDS.has(req.query.sort) ? req.query.sort : "id";
  const direction = String(req.query.direction || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  try {
    const { rows } = await pool.query(
      `SELECT ${USER_SELECT_COLUMNS} FROM users ORDER BY ${sort} ${direction}`
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id must be a positive integer" });
  }

  try {
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id must be a positive integer" });
  }

  const { data, errors } = validateUserPayload(req.body || {}, { partial: true });
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const fields = Object.entries(data);
  if (fields.length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update" });
  }

  const setClauses = fields.map(([key], index) => `${key} = $${index + 1}`);
  const values = fields.map(([, value]) => value);
  values.push(id);

  try {
    const { rows } = await pool.query(
      `
        UPDATE users
        SET ${setClauses.join(", ")}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING ${USER_SELECT_COLUMNS}
      `,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id must be a positive integer" });
  }

  try {
    const { rows } = await pool.query(
      `
        DELETE FROM users
        WHERE id = $1
        RETURNING ${USER_SELECT_COLUMNS}
      `,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      message: "User removed",
      user: rows[0],
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

async function bootstrap() {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`Practice 19 API started on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
