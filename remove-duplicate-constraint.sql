-- Remove duplicate constraint - keep only one
-- Run this in Supabase SQL Editor

-- Remove the old constraint (keep the newer one)
ALTER TABLE token_cards 
DROP CONSTRAINT IF EXISTS valid_tab_type;
