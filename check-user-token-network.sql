-- Check the network value for your specific token
-- Run this in Supabase SQL Editor

SELECT 
    id,
    token_name,
    token_symbol,
    token_contract_address,
    network,
    minting_completed
FROM user_tokens 
WHERE token_contract_address = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.vftd';
-- Run this in Supabase SQL Editor

SELECT 
    id,
    token_name,
    token_symbol,
    token_contract_address,
    network,
    minting_completed
FROM user_tokens 
WHERE token_contract_address = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.vftd';
