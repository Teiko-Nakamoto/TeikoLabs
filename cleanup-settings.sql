-- Clean up redundant competition_active setting from quiz_settings table
-- This setting is now managed by the quiz_competition_status table

-- First, let's see what settings we currently have
SELECT * FROM quiz_settings ORDER BY setting_key;

-- Remove the redundant competition_active setting
DELETE FROM quiz_settings WHERE setting_key = 'competition_active';

-- Verify the cleanup
SELECT * FROM quiz_settings ORDER BY setting_key;

-- Show the current competition status from the proper table
SELECT * FROM quiz_competition_status;

