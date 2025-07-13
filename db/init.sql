CREATE TABLE users (
  id SERIAL PRIMARY KEY,                          -- Internal app user ID
  provider VARCHAR(50) NOT NULL DEFAULT 'google', -- Auth provider
  provider_user_id VARCHAR(255) NOT NULL,         -- Unique user ID from provider
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_picture TEXT,

  active BOOLEAN NOT NULL DEFAULT TRUE,           -- Enable/disable user
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP,                           -- Soft delete

  UNIQUE (provider, provider_user_id),            -- Prevent duplicate users
  UNIQUE (email)                                  -- Optional: block duplicate emails
);


CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- FK to users table

  full_name VARCHAR(255),                 -- Repeating name is optional, could override
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),

  profile_photo TEXT,                     -- Can store URL or base64 metadata
  location_access BOOLEAN DEFAULT FALSE,  -- Whether user gave permission

  latitude DECIMAL(9,6),                  -- Precision up to ~11cm
  longitude DECIMAL(9,6),

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE (user_id)                        -- 1-to-1 relation with users
);

CREATE INDEX idx_user_profiles_gender ON user_profiles (gender);

CREATE INDEX idx_user_profiles_dob ON user_profiles (date_of_birth);


CREATE TABLE user_locations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  location GEOGRAPHY(Point, 4326),
  location_access BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE (user_id)
);

-- Add index (run only after your table is created)
CREATE INDEX IF NOT EXISTS idx_user_locations_location
  ON user_locations USING GIST (location);


-- ✅ SEEN USERS TABLE (Optimized)
CREATE TABLE user_seen_profiles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seen_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(10) NOT NULL DEFAULT 'like' CHECK (action IN ('like', 'dislike')),
  seen_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, seen_user_id)
);

-- ✅ INDEXES FOR BIDIRECTIONAL LOOKUP (Mutual Likes)
CREATE INDEX IF NOT EXISTS idx_seen_user ON user_seen_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_seen_lookup_reverse ON user_seen_profiles (seen_user_id, user_id);

-- ✅ MATCHED USERS TABLE (Safe Against Race Conditions)
CREATE TABLE user_matches (
  user_id_1 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_2 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP DEFAULT now(),
  CHECK (user_id_1 < user_id_2),
  PRIMARY KEY (user_id_1, user_id_2)
);

-- ✅ INDEX FOR REVERSE MATCH LOOKUP
CREATE INDEX IF NOT EXISTS idx_user_matches_reverse ON user_matches (user_id_2);

