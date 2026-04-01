-- Run this in your Vercel/Neon SQL Editor to fix the schema

-- 1. Fix the users table by adding the 'paid' column
ALTER TABLE users ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

-- 2. Create the missing intake_responses table
CREATE TABLE IF NOT EXISTS intake_responses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  intake_role TEXT,
  intake_status TEXT,
  intake_goal TEXT,
  intake_weighing TEXT,
  intake_urgency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the missing cce_responses table
CREATE TABLE IF NOT EXISTS cce_responses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_history JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure sessions table exists (just in case)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
-- 5. Create the missing personality_responses table
CREATE TABLE IF NOT EXISTS personality_responses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  profile_data JSONB,
  message_history JSONB,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5a. Ensure existing tables receive new columns
ALTER TABLE personality_responses ADD COLUMN IF NOT EXISTS message_history JSONB;
ALTER TABLE personality_responses ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE personality_responses ALTER COLUMN profile_data DROP NOT NULL;
