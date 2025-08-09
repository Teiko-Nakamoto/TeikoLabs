-- Fix the id column in token_cards table to auto-increment
-- Run this in Supabase SQL Editor

-- Check if the id column has a sequence
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'token_cards' AND column_name = 'id';

-- Create a sequence for the id column if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS token_cards_id_seq;

-- Set the id column to use the sequence as default
ALTER TABLE token_cards 
ALTER COLUMN id SET DEFAULT nextval('token_cards_id_seq');

-- Set the sequence to start from the next available number
SELECT setval('token_cards_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM token_cards;

-- Verify the change
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'token_cards' AND column_name = 'id';
-- Run this in Supabase SQL Editor

-- Check if the id column has a sequence
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'token_cards' AND column_name = 'id';

-- Create a sequence for the id column if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS token_cards_id_seq;

-- Set the id column to use the sequence as default
ALTER TABLE token_cards 
ALTER COLUMN id SET DEFAULT nextval('token_cards_id_seq');

-- Set the sequence to start from the next available number
SELECT setval('token_cards_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM token_cards;

-- Verify the change
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'token_cards' AND column_name = 'id';
