-- Migration to convert all existing timestamps to UTC and update defaults

-- 1. Update all existing timestamps to UTC (assumes they were stored in server local time)
-- Note: Adjust the timezone in the following queries based on your server's previous timezone
-- For example, if your server was in IST (Asia/Kolkata), use 'Asia/Kolkata'

-- Convert users table timestamps
UPDATE users 
SET 
  last_login_at = last_login_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
  created_at = created_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
  updated_at = updated_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
  deleted_at = CASE 
    WHEN deleted_at IS NOT NULL THEN deleted_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC'
    ELSE NULL 
  END
WHERE last_login_at IS NOT NULL OR created_at IS NOT NULL OR updated_at IS NOT NULL OR deleted_at IS NOT NULL;

-- Convert user_profiles table timestamps
UPDATE user_profiles 
SET 
  created_at = created_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
  updated_at = updated_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC'
WHERE created_at IS NOT NULL OR updated_at IS NOT NULL;

-- Convert user_locations table timestamps
UPDATE user_locations 
SET 
  updated_at = updated_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC'
WHERE updated_at IS NOT NULL;

-- Convert user_seen_profiles table timestamps
UPDATE user_seen_profiles 
SET 
  seen_at = seen_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC'
WHERE seen_at IS NOT NULL;

-- Convert user_matches table timestamps
UPDATE user_matches 
SET 
  matched_at = matched_at AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC'
WHERE matched_at IS NOT NULL;

-- 2. Update default values to use UTC (for new installations, these are already in init.sql)
-- These ALTER statements are for existing databases

ALTER TABLE users 
  ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

ALTER TABLE user_profiles 
  ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

ALTER TABLE user_locations 
  ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

ALTER TABLE user_seen_profiles 
  ALTER COLUMN seen_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

ALTER TABLE user_matches 
  ALTER COLUMN matched_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

-- 3. Create a function to ensure all future timestamp operations use UTC
CREATE OR REPLACE FUNCTION utc_now() 
RETURNS TIMESTAMP AS $$
BEGIN
  RETURN CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

-- Add a comment to document this migration
COMMENT ON FUNCTION utc_now() IS 'Returns current timestamp in UTC timezone. Use this instead of now() for consistent UTC timestamps.';
