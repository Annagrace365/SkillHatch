/*
  # Add Premium Column to Users Table

  1. Schema Updates
    - Add `is_premium` column to users table
    - Set default value to false for existing users
    - Add index for premium status queries

  2. Security
    - Maintain existing RLS policies
    - Ensure premium status is properly protected
*/

-- Add premium column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE users ADD COLUMN is_premium boolean DEFAULT false;
  END IF;
END $$;

-- Create index for premium status queries
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium);

-- Update existing users to have premium status false by default
UPDATE users SET is_premium = false WHERE is_premium IS NULL;