-- Reset Database Script
-- WARNING: This will delete ALL data in the database!
-- Only use this for development/testing purposes

-- Drop all tables in reverse order of dependencies
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop extensions (optional - comment out if you want to keep them)
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- Recreate the schema by running init.sql
\i /docker-entrypoint-initdb.d/01-init.sql
\i /docker-entrypoint-initdb.d/02-seed.sql