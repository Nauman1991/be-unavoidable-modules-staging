CREATE TABLE IF NOT EXISTS terms_acceptances (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address  TEXT
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user_id ON terms_acceptances (user_id);
