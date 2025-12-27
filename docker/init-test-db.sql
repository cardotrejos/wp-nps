-- Initialize test database with required extensions and settings
-- This runs automatically when the test container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default timezone
SET timezone = 'UTC';

-- Create a test role for RLS testing (optional, for advanced isolation tests)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'test_user') THEN
    CREATE ROLE test_user WITH LOGIN PASSWORD 'test_password';
  END IF;
END
$$;

-- Grant permissions to test user
GRANT ALL PRIVILEGES ON DATABASE "wp-nps-test" TO test_user;

-- Note: Schema and RLS policies will be created via drizzle-kit push
-- and the enable-rls.sql migration during test setup
