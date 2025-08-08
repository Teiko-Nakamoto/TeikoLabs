-- App Settings Table
-- This table stores application-wide settings like default tabs, feature flags, etc.

CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Add comment for documentation
COMMENT ON TABLE app_settings IS 'Stores application-wide settings and configuration';
COMMENT ON COLUMN app_settings.key IS 'Setting key (e.g., default_tab, feature_flags)';
COMMENT ON COLUMN app_settings.value IS 'Setting value (JSON or string)';
COMMENT ON COLUMN app_settings.description IS 'Human-readable description of the setting';

-- Insert default settings
INSERT INTO app_settings (key, value, description) VALUES
  ('default_tab', 'featured', 'Default tab to show on home page (featured or practice)'),
  ('maintenance_mode', 'false', 'Whether the application is in maintenance mode'),
  ('feature_flags', '{}', 'JSON object containing feature flags')
ON CONFLICT (key) DO NOTHING;
