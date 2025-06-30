/*
  # Create Startup Ideas Schema

  1. New Tables
    - `startup_ideas`: Core startup idea data
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `market_size` (text)
      - `difficulty` (enum: Easy, Medium, Hard)
      - `time_to_market` (text)
      - `revenue_model` (text)
      - `target_audience` (text)
      - `key_features` (jsonb array)
      - `competitive_advantage` (text)
      - `required_skills` (jsonb array)
      - `target_interests` (jsonb array)
      - `keywords` (jsonb array)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Indexes
    - Full-text search on title and description
    - GIN indexes for JSONB arrays (skills, interests, keywords)
    - Index on difficulty and is_active

  3. Security
    - Enable RLS
    - Allow public read access for active ideas
    - Restrict write access to authenticated users (for future admin features)
*/

-- Create difficulty enum
CREATE TYPE startup_difficulty AS ENUM ('Easy', 'Medium', 'Hard');

-- Create startup_ideas table
CREATE TABLE IF NOT EXISTS startup_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  market_size text NOT NULL,
  difficulty startup_difficulty NOT NULL,
  time_to_market text NOT NULL,
  revenue_model text NOT NULL,
  target_audience text NOT NULL,
  key_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  competitive_advantage text NOT NULL,
  required_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_startup_ideas_active ON startup_ideas(is_active);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_difficulty ON startup_ideas(difficulty);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_created_at ON startup_ideas(created_at DESC);

-- GIN indexes for JSONB arrays (for efficient array operations)
CREATE INDEX IF NOT EXISTS idx_startup_ideas_required_skills ON startup_ideas USING GIN (required_skills);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_target_interests ON startup_ideas USING GIN (target_interests);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_keywords ON startup_ideas USING GIN (keywords);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_startup_ideas_search ON startup_ideas USING GIN (to_tsvector('english', title || ' ' || description || ' ' || target_audience || ' ' || competitive_advantage));

-- Enable RLS
ALTER TABLE startup_ideas ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active ideas
CREATE POLICY "Anyone can read active startup ideas"
  ON startup_ideas
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow authenticated users to insert/update (for future admin features)
CREATE POLICY "Authenticated users can manage startup ideas"
  ON startup_ideas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_startup_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER startup_ideas_updated_at
  BEFORE UPDATE ON startup_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_startup_ideas_updated_at();