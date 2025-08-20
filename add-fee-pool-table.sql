-- Add sbtc_fee_pool_history table
CREATE TABLE IF NOT EXISTS sbtc_fee_pool_history (
    id SERIAL PRIMARY KEY,
    fee_pool_amount BIGINT NOT NULL,
    previous_amount BIGINT,
    change_amount BIGINT,
    change_percentage DECIMAL(10,4),
    calculated_reward INTEGER NOT NULL,
    reward_calculation JSONB,
    blockchain_timestamp TIMESTAMP,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create index for the new table
CREATE INDEX IF NOT EXISTS idx_sbtc_fee_pool_history_timestamp ON sbtc_fee_pool_history(recorded_at);

-- Enable RLS on the new table
ALTER TABLE sbtc_fee_pool_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for the new table only)
DROP POLICY IF EXISTS "Allow public read access to sbtc_fee_pool_history" ON sbtc_fee_pool_history;
DROP POLICY IF EXISTS "Allow authenticated insert to sbtc_fee_pool_history" ON sbtc_fee_pool_history;
DROP POLICY IF EXISTS "Allow admin access to all tables" ON sbtc_fee_pool_history;

-- Create policies for the new table
CREATE POLICY "Allow public read access to sbtc_fee_pool_history" ON sbtc_fee_pool_history
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert to sbtc_fee_pool_history" ON sbtc_fee_pool_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin access to all tables" ON sbtc_fee_pool_history
    FOR ALL USING (true);

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'sbtc_fee_pool_history'
ORDER BY ordinal_position;
