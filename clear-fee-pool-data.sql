-- Clear old dummy data from fee pool history
DELETE FROM sbtc_fee_pool_history;

-- Verify the table is empty
SELECT COUNT(*) as remaining_records FROM sbtc_fee_pool_history;
