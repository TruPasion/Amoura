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