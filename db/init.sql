CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (name)
SELECT 'user_' || LPAD(i::text, 3, '0')
FROM generate_series(1, 50) AS s(i);

INSERT INTO scores (user_id, score, timestamp)
SELECT
 floor(random()* 50) + 1,
  (random() * 1000)::int,
  NOW() - (interval '30 days' * random())
FROM generate_series(1, 1000);