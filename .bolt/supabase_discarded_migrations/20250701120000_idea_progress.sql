-- Migration: Create idea_progress table for tracking user progress on startup ideas

CREATE TABLE IF NOT EXISTS idea_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES startup_ideas(id) ON DELETE CASCADE,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, idea_id)
); 