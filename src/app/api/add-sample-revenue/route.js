// API Route: Add Sample Revenue Data
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function POST(request) {
  try {
    console.log('🔍 Adding sample revenue data...');

    // Sample data for the last 7 days
    const sampleData = [
      {
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue_sats: 12500,
        revenue_usd: 7.50,
        trading_fees_sats: 8000,
        platform_fees_sats: 4500,
        total_trades: 45,
        avg_trade_size_sats: 278,
        notes: 'First day of tracking'
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue_sats: 15800,
        revenue_usd: 9.48,
        trading_fees_sats: 10200,
        platform_fees_sats: 5600,
        total_trades: 52,
        avg_trade_size_sats: 304,
        notes: 'Increased trading volume'
      },
      {
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue_sats: 14200,
        revenue_usd: 8.52,
        trading_fees_sats: 9200,
        platform_fees_sats: 5000,
        total_trades: 48,
        avg_trade_size_sats: 296,
        notes: 'Steady performance'
      },
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue_sats: 18900,
        revenue_usd: 11.34,
        trading_fees_sats: 12100,
        platform_fees_sats: 6800,
        total_trades: 61,
        avg_trade_size_sats: 310,
        notes: 'Peak day'
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue_sats: 16500,
        revenue_usd: 9.90,
        trading_fees_sats: 10800,
        platform_fees_sats: 5700,
        total_trades: 55,
        avg_trade_size_sats: 300,
        notes: 'Weekend activity'
      },
      {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue_sats: 13200,
        revenue_usd: 7.92,
        trading_fees_sats: 8500,
        platform_fees_sats: 4700,
        total_trades: 44,
        avg_trade_size_sats: 300,
        notes: 'Lower weekend volume'
      },
      {
        date: new Date().toISOString().split('T')[0],
        revenue_sats: 17800,
        revenue_usd: 10.68,
        trading_fees_sats: 11500,
        platform_fees_sats: 6300,
        total_trades: 58,
        avg_trade_size_sats: 307,
        notes: 'Recovery day'
      }
    ];

    // Insert sample data
    const { data, error } = await supabaseServer
      .from('daily_revenue')
      .upsert(sampleData, { onConflict: 'date' });

    if (error) {
      console.error('❌ Error inserting sample data:', error);
      return NextResponse.json(
        { error: 'Failed to insert sample data', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Sample revenue data added successfully');

    return NextResponse.json({
      success: true,
      message: 'Sample revenue data added successfully',
      data: data
    });

  } catch (error) {
    console.error('❌ Error in add-sample-revenue API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
