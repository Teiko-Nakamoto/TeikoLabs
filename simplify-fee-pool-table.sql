-- Drop the existing table and recreate it with only essential fields
DROP TABLE IF EXISTS sbtc_fee_pool_history CASCADE;

-- Create simplified table with only essential fields
CREATE TABLE IF NOT EXISTS sbtc_fee_pool_history (
    id SERIAL PRIMARY KEY,
    fee_pool_amount BIGINT NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_sbtc_fee_pool_history_timestamp ON sbtc_fee_pool_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE sbtc_fee_pool_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS "Allow public read access to sbtc_fee_pool_history" ON sbtc_fee_pool_history;
DROP POLICY IF EXISTS "Allow authenticated insert to sbtc_fee_pool_history" ON sbtc_fee_pool_history;
DROP POLICY IF EXISTS "Allow admin access to sbtc_fee_pool_history" ON sbtc_fee_pool_history;

CREATE POLICY "Allow public read access to sbtc_fee_pool_history" ON sbtc_fee_pool_history
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert to sbtc_fee_pool_history" ON sbtc_fee_pool_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin access to sbtc_fee_pool_history" ON sbtc_fee_pool_history
    FOR ALL USING (true);
