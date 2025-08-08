-- CORS Whitelist Management Table
-- This table stores domains that are allowed to make CORS requests to the API

CREATE TABLE IF NOT EXISTS cors_whitelist (
  id SERIAL PRIMARY KEY,
  url VARCHAR(255) NOT NULL UNIQUE,
  admin_wallet VARCHAR(100) NOT NULL,
  signature TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cors_whitelist_url ON cors_whitelist(url);
CREATE INDEX IF NOT EXISTS idx_cors_whitelist_admin ON cors_whitelist(admin_wallet);

-- Add comment for documentation
COMMENT ON TABLE cors_whitelist IS 'Stores domains allowed to make CORS requests to the API';
COMMENT ON COLUMN cors_whitelist.url IS 'The domain URL (e.g., https://example.com)';
COMMENT ON COLUMN cors_whitelist.admin_wallet IS 'Admin wallet address that added this URL';
COMMENT ON COLUMN cors_whitelist.signature IS 'Wallet signature for the CORS URL addition';
COMMENT ON COLUMN cors_whitelist.message IS 'Original message that was signed';
