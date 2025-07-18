import express, { Request, Response } from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface Score {
  name: string;
  score: number;
  time: string;
}

app.get("/", async (_req: Request, res: Response) => {
  const result = await pool.query<Score>(`
    SELECT u.name, s.score, to_char(s.timestamp, 'HH24:MI:SS') AS time
    FROM scores s
    JOIN users u ON u.id = s.user_id
    ORDER BY s.score DESC
    LIMIT 10
 `);

  res.render("index", { scores: result.rows });
});

app.get("/player/:name", async (req: Request, res: Response) => {
  const name = req.params.name;

  const stats = await pool.query(
    `
        SELECT
            COUNT(*) AS games_played,
            MAX(score) AS high_score,
            ROUND(AVG(score))::int AS avg_score,
            MAX(timestamp) AS last_played
        FROM scores s
        JOIN users u ON u.id = s.user_id
        WHERE u.name = $1
    `,
    [name],
  );

  const recent = await pool.query(
    `
        SELECT score, to_char(s.timestamp, 'YYYY-MM-DD HH24:MI') as time
        FROM scores s
        JOIN users u ON u.id = s.user_id
        WHERE u.name = $1
        ORDER BY s.timestamp DESC
        LIMIT 10
    `,
    [name],
  );

  const leaderboardContext = await pool.query(
    `
        WITH ranked AS (
            SELECT
            u.name,
            s.score,
            RANK() OVER (ORDER BY s.score DESC) AS rank
            FROM scores s
            JOIN users u ON u.id = s.user_id
        ),
        target AS (
            SELECT rank FROM ranked WHERE name = $1 ORDER BY score DESC LIMIT 1
        )
        SELECT * FROM ranked
        WHERE rank BETWEEN (SELECT rank FROM target) - 2 AND (SELECT rank FROM target) + 2
        ORDER BY rank;
    `,
    [name],
  );

  res.render("player", {
    name,
    stats: stats.rows[0],
    recent: recent.rows,
    leaderboardContext: leaderboardContext.rows,
  });
});

app.post("/submit", async (req: Request, res: Response) => {
  const { name, score } = req.body;
  const parsedScore = parseInt(score, 10);
  if (!name || isNaN(parsedScore)) return res.status(400).send("Invalid input");

  const userId = await findOrCreateUser(name);
  await pool.query(`INSERT INTO scores (user_id, score) VALUES ($1, $2)`, [
    userId,
    parsedScore,
  ]);

  res.redirect(`/player/${encodeURIComponent(name)}`);
});

// Helpers

async function findOrCreateUser(name: string): Promise<number> {
  const existing = await pool.query(`SELECT id FROM users WHERE name = $1`, [
    name,
  ]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const created = await pool.query(
    `INSERT INTO users (name) VALUES ($1) RETURNING id`,
    [name],
  );
  return created.rows[0].id;
}

const PORT = process.env.PORT || 3123;
app.listen(
  PORT,
  () => console.log(`Server running on http://localhost:${PORT}`),
);
