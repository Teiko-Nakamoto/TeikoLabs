-- Check token_cards table structure only
-- Run this in Supabase SQL Editor

-- Check token_cards table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'token_cards' 
ORDER BY ordinal_position;
-- Run this in Supabase SQL Editor

-- Check token_cards table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'token_cards' 
ORDER BY ordinal_position;
