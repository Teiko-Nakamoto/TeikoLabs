-- Drop existing table if it exists
DROP TABLE IF EXISTS daily_revenue CASCADE;

-- Create fresh daily_revenue table
CREATE TABLE daily_revenue (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    revenue_sats BIGINT NOT NULL,
    revenue_usd DECIMAL(15,2) NOT NULL,
    trading_fees_sats BIGINT NOT NULL DEFAULT 0,
    platform_fees_sats BIGINT NOT NULL DEFAULT 0,
    total_trades INTEGER NOT NULL DEFAULT 0,
    avg_trade_size_sats BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_daily_revenue_date ON daily_revenue(date);
CREATE INDEX idx_daily_revenue_amount ON daily_revenue(revenue_sats);

-- Enable row level security
ALTER TABLE daily_revenue ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Allow read access to daily_revenue" ON daily_revenue
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update daily_revenue" ON daily_revenue
    FOR ALL USING (true);

-- Create trigger function for updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_daily_revenue_updated_at 
    BEFORE UPDATE ON daily_revenue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert clean sample data (you can replace this with your actual data)
INSERT INTO daily_revenue (date, revenue_sats, revenue_usd, trading_fees_sats, platform_fees_sats, total_trades, avg_trade_size_sats, notes) VALUES
('2024-08-14', 1782, 1.07, 1200, 582, 12, 149, 'Clean data entry'),
('2024-08-15', 2589, 1.55, 1800, 789, 18, 144, 'Clean data entry'),
('2024-08-16', 1589, 0.95, 1100, 489, 10, 159, 'Clean data entry');

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_revenue' 
ORDER BY ordinal_position;
