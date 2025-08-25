-- Clear ALL fee pool history data (including dummy data)
DELETE FROM sbtc_fee_pool_history;

-- Reset the auto-increment counter
ALTER SEQUENCE sbtc_fee_pool_history_id_seq RESTART WITH 1;

-- Verify the table is empty
SELECT COUNT(*) as remaining_records FROM sbtc_fee_pool_history;

