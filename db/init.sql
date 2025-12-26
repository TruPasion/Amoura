CREATE TABLE
  users (
    id SERIAL PRIMARY KEY, -- Internal app user ID
    provider VARCHAR(50) NOT NULL DEFAULT 'google', -- Auth provider
    provider_user_id VARCHAR(255) NOT NULL, -- Unique user ID from provider
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    profile_picture TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE, -- Enable/disable user
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now (),
    updated_at TIMESTAMP DEFAULT now (),
    deleted_at TIMESTAMP, -- Soft delete
    UNIQUE (provider, provider_user_id), -- Prevent duplicate users
    UNIQUE (email) -- Optional: block duplicate emails
  );

CREATE TABLE
  user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE, -- FK to users table
    full_name VARCHAR(255), -- Repeating name is optional, could override
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    -- Can store URL or base64 metadata
    location_access BOOLEAN DEFAULT FALSE, -- Whether user gave permission
    latitude DECIMAL(9, 6), -- Precision up to ~11cm
    longitude DECIMAL(9, 6),
    created_at TIMESTAMP DEFAULT now (),
    updated_at TIMESTAMP DEFAULT now (),
    UNIQUE (user_id) -- 1-to-1 relation with users
  );

CREATE INDEX idx_user_profiles_gender ON user_profiles (gender);

CREATE INDEX idx_user_profiles_dob ON user_profiles (date_of_birth);

CREATE TABLE
  user_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    location GEOGRAPHY (Point, 4326),
    location_access BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT now (),
    UNIQUE (user_id)
  );

-- Add index (run only after your table is created)
CREATE INDEX IF NOT EXISTS idx_user_locations_location ON user_locations USING GIST (location);

-- ✅ SEEN USERS TABLE (Optimized)
CREATE TABLE
  user_seen_profiles (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    seen_user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    action VARCHAR(10) NOT NULL DEFAULT 'like' CHECK (action IN ('like', 'dislike')),
    seen_at TIMESTAMP DEFAULT now (),
    PRIMARY KEY (user_id, seen_user_id)
  );

-- ✅ INDEXES FOR BIDIRECTIONAL LOOKUP (Mutual Likes)
CREATE INDEX IF NOT EXISTS idx_seen_user ON user_seen_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_seen_lookup_reverse ON user_seen_profiles (seen_user_id, user_id);

-- Enable UUID extension (only once per DB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhanced matched users table
CREATE TABLE
  user_matches (
    match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (), -- DB generates UUID
    user_id_1 INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    user_id_2 INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    matched_at TIMESTAMP DEFAULT now (),
    CHECK (user_id_1 < user_id_2),
    UNIQUE (user_id_1, user_id_2) -- prevents duplicate matches even with UUID
  );

CREATE INDEX IF NOT EXISTS idx_user_matches_user1 ON user_matches (user_id_1);

CREATE INDEX IF NOT EXISTS idx_user_matches_user2 ON user_matches (user_id_2);

ALTER TABLE user_profiles
DROP COLUMN profile_photo;

CREATE TABLE
  user_profile_pictures (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INT NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    UNIQUE (user_id, position)
  );

CREATE UNIQUE INDEX one_primary_photo_per_user ON user_profile_pictures (user_id)
WHERE
  is_primary = true;

-- lets add the profile section
ALTER TABLE user_profiles
ADD COLUMN bio TEXT,
ADD COLUMN height_cm SMALLINT,
ADD COLUMN job_title VARCHAR(150),
ADD COLUMN company VARCHAR(150),
ADD COLUMN education VARCHAR(150),
ADD COLUMN drinking_id SMALLINT,
ADD COLUMN smoking_id SMALLINT,
ADD COLUMN exercise_id SMALLINT;

CREATE TABLE
  drinking_habits (
    id SMALLSERIAL PRIMARY KEY,
    label VARCHAR(50) UNIQUE NOT NULL
  );

INSERT INTO
  drinking_habits (label)
VALUES
  ('Never'),
  ('Rarely'),
  ('Socially'),
  ('Regularly'),
  ('Prefer not to say');

CREATE TABLE
  smoking_habits (
    id SMALLSERIAL PRIMARY KEY,
    label VARCHAR(50) UNIQUE NOT NULL
  );

INSERT INTO
  smoking_habits (label)
VALUES
  ('Never'),
  ('Socially'),
  ('Regularly'),
  ('Trying to quit'),
  ('Prefer not to say');

CREATE TABLE
  exercise_habits (
    id SMALLSERIAL PRIMARY KEY,
    label VARCHAR(50) UNIQUE NOT NULL
  );

INSERT INTO
  exercise_habits (label)
VALUES
  ('Never'),
  ('Rarely'),
  ('Sometimes'),
  ('Often'),
  ('Daily');

ALTER TABLE user_profiles ADD CONSTRAINT fk_user_drinking FOREIGN KEY (drinking_id) REFERENCES drinking_habits (id);

ALTER TABLE user_profiles ADD CONSTRAINT fk_user_smoking FOREIGN KEY (smoking_id) REFERENCES smoking_habits (id);

ALTER TABLE user_profiles ADD CONSTRAINT fk_user_exercise FOREIGN KEY (exercise_id) REFERENCES exercise_habits (id);

CREATE TABLE
  interests (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
  );

CREATE TABLE
  user_interests (
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
    interest_id SMALLINT REFERENCES interests (id),
    PRIMARY KEY (user_id, interest_id)
  );

INSERT INTO
  interests (name)
VALUES
  ('Travel'),
  ('Music'),
  ('Movies'),
  ('Reading'),
  ('Cooking'),
  ('Fitness'),
  ('Photography'),
  ('Art'),
  ('Gaming'),
  ('Hiking'),
  ('Dancing'),
  ('Yoga'),
  ('Coffee'),
  ('Wine'),
  ('Dogs'),
  ('Cats'),
  ('Sports'),
  ('Beach');