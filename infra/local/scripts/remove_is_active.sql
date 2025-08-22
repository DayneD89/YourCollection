-- Remove is_active column from users table
ALTER TABLE users DROP COLUMN IF EXISTS is_active;