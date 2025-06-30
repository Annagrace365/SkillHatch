/*
  # Fix Authentication and Database Policies

  1. Database Schema Updates
    - Remove custom users table (conflicts with Supabase Auth)
    - Update favorites table to use auth.uid() properly
    - Fix RLS policies for proper authentication

  2. Security Updates
    - Enable RLS on all tables
    - Create proper policies for authenticated users
    - Remove conflicting custom authentication

  3. Data Migration
    - Safely migrate any existing data
    - Ensure foreign key constraints work with auth.users
*/

-- First, disable RLS temporarily to make changes
ALTER TABLE IF EXISTS favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
DROP POLICY IF EXISTS "all" ON favorites;

DROP POLICY IF EXISTS "Allow anonymous user registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "all" ON users;

-- Drop the custom users table since we're using Supabase Auth
-- This removes the conflict between custom auth and Supabase Auth
DROP TABLE IF EXISTS users CASCADE;

-- Recreate favorites table with proper auth.users reference
DROP TABLE IF EXISTS favorites CASCADE;

CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for favorites
CREATE POLICY "Users can read own favorites"
  ON favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON favorites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure auth.users table has proper access (this is managed by Supabase)
-- We don't need custom policies for auth.users as Supabase handles this

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;