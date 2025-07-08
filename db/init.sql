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
