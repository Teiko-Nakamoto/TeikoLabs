-- Daily Revenue Tracking Table for Line Charts
-- This table stores daily revenue data that can be used to generate line charts

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

-- Index for efficient date-based queries
CREATE INDEX idx_daily_revenue_date ON daily_revenue(date);

-- Index for revenue queries
CREATE INDEX idx_daily_revenue_amount ON daily_revenue(revenue_sats);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_revenue ENABLE ROW LEVEL SECURITY;

-- Policy for read access (adjust as needed for your auth setup)
CREATE POLICY "Allow read access to daily_revenue" ON daily_revenue
    FOR SELECT USING (true);

-- Policy for insert/update (restrict to admin users if needed)
CREATE POLICY "Allow insert/update daily_revenue" ON daily_revenue
    FOR ALL USING (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_daily_revenue_updated_at 
    BEFORE UPDATE ON daily_revenue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion (you can modify these values)
INSERT INTO daily_revenue (date, revenue_sats, revenue_usd, trading_fees_sats, platform_fees_sats, total_trades, avg_trade_size_sats, notes) VALUES
('2024-01-15', 12500, 7.50, 8000, 4500, 45, 278, 'First day of tracking'),
('2024-01-16', 15800, 9.48, 10200, 5600, 52, 304, 'Increased trading volume'),
('2024-01-17', 14200, 8.52, 9200, 5000, 48, 296, 'Steady performance'),
('2024-01-18', 18900, 11.34, 12100, 6800, 61, 310, 'Peak day'),
('2024-01-19', 16500, 9.90, 10800, 5700, 55, 300, 'Weekend activity'),
('2024-01-20', 13200, 7.92, 8500, 4700, 44, 300, 'Lower weekend volume'),
('2024-01-21', 17800, 10.68, 11500, 6300, 58, 307, 'Recovery day');

-- Query to get data for line chart (last 30 days)
-- SELECT 
--     date,
--     revenue_sats,
--     revenue_usd,
--     trading_fees_sats,
--     platform_fees_sats,
--     total_trades
-- FROM daily_revenue 
-- WHERE date >= CURRENT_DATE - INTERVAL '30 days'
-- ORDER BY date ASC;

-- Query to get total revenue for a date range
-- SELECT 
--     SUM(revenue_sats) as total_revenue_sats,
--     SUM(revenue_usd) as total_revenue_usd,
--     AVG(revenue_sats) as avg_daily_revenue_sats,
--     COUNT(*) as days_tracked
-- FROM daily_revenue 
-- WHERE date >= '2024-01-01' AND date <= '2024-01-31';
