-- Debug SQL to check database state
-- Run this in Supabase SQL Editor

-- 1. Check user_tokens table structure and data
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_tokens' 
ORDER BY ordinal_position;

-- 2. Check your specific token record
SELECT 
    id,
    token_name,
    token_symbol,
    token_contract_address,
    dex_contract_address,
    network,
    minting_completed,
    created_at
FROM user_tokens 
WHERE token_contract_address = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.vftd';

-- 3. Check token_cards table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'token_cards' 
ORDER BY ordinal_position;

-- 4. Check existing token_cards data
SELECT 
    id,
    name,
    symbol,
    tab_type,
    token_info,
    dex_info
FROM token_cards;

-- 5. Check token_cards constraints
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'token_cards';
-- Run this in Supabase SQL Editor

-- 1. Check user_tokens table structure and data
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_tokens' 
ORDER BY ordinal_position;

-- 2. Check your specific token record
SELECT 
    id,
    token_name,
    token_symbol,
    token_contract_address,
    dex_contract_address,
    network,
    minting_completed,
    created_at
FROM user_tokens 
WHERE token_contract_address = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.vftd';

-- 3. Check token_cards table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'token_cards' 
ORDER BY ordinal_position;

-- 4. Check existing token_cards data
SELECT 
    id,
    name,
    symbol,
    tab_type,
    token_info,
    dex_info
FROM token_cards;

-- 5. Check token_cards constraints
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'token_cards';
