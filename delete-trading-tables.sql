-- SQL to delete the trading tables we created
-- Run this in your Supabase SQL editor

-- Drop the trigger first (if it exists)
DROP TRIGGER IF EXISTS trigger_update_treasury_revenue ON mas_trades;

-- Drop the function (if it exists)
DROP FUNCTION IF EXISTS update_treasury_revenue();

-- Drop the tables
DROP TABLE IF EXISTS mas_trades CASCADE;
DROP TABLE IF EXISTS mas_treasury_revenue CASCADE;

-- Verify tables are deleted
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('mas_trades', 'mas_treasury_revenue');

-- Should return no rows if tables were successfully deleted
