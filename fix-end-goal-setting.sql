-- Fix Quiz End Goal Setting
-- Run this in your Supabase SQL Editor

-- First, let's check if the setting exists
SELECT * FROM quiz_settings WHERE setting_key = 'competition_end_threshold';

-- If it doesn't exist, insert it
INSERT INTO quiz_settings (setting_key, setting_value) 
VALUES ('competition_end_threshold', '21000000')
ON CONFLICT (setting_key) DO NOTHING;

-- If it exists but has wrong value, update it
UPDATE quiz_settings 
SET setting_value = '21000000'
WHERE setting_key = 'competition_end_threshold';

-- Verify the setting
SELECT setting_key, setting_value FROM quiz_settings WHERE setting_key = 'competition_end_threshold';

-- Also ensure all required quiz settings exist
INSERT INTO quiz_settings (setting_key, setting_value) VALUES
    ('competition_active', 'true'),
    ('total_points_earned', '0'),
    ('competition_end_threshold', '21000000'),
    ('quiz_completion_points', '21')
ON CONFLICT (setting_key) DO NOTHING;

-- Show all quiz settings
SELECT * FROM quiz_settings ORDER BY setting_key;
