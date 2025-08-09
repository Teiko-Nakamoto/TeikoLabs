-- Fix the tab_type constraint to allow user-created project types
-- Run this in Supabase SQL Editor

-- Check current constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%tab_type%';

-- Drop the old constraint
ALTER TABLE token_cards 
DROP CONSTRAINT IF EXISTS token_cards_tab_type_check;

-- Add new constraint that includes user-created types
ALTER TABLE token_cards 
ADD CONSTRAINT token_cards_tab_type_check 
CHECK (tab_type IN ('featured', 'practice', 'user_created_mainnet', 'user_created_testnet'));

-- Verify the new constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%tab_type%';
