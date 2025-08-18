// API Route: Get Daily Revenue Data for Charts
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30'; // Default to 30 days
    const limit = parseInt(days);

    console.log('🔍 Fetching daily revenue data for last', limit, 'days');

    // Get daily revenue data from the database
    const { data: revenueData, error } = await supabaseServer
      .from('daily_revenue')
      .select('*')
      .gte('date', new Date(Date.now() - (limit * 24 * 60 * 60 * 1000)).toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching daily revenue:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily revenue data', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Daily revenue data fetched:', revenueData?.length, 'records');

    // Calculate summary statistics
    const totalRevenue = revenueData?.reduce((sum, record) => sum + record.revenue_sats, 0) || 0;
    const avgDailyRevenue = revenueData?.length > 0 ? totalRevenue / revenueData.length : 0;
    const maxDailyRevenue = revenueData?.reduce((max, record) => Math.max(max, record.revenue_sats), 0) || 0;

    return NextResponse.json({
      success: true,
      data: revenueData || [],
      summary: {
        totalRevenue,
        avgDailyRevenue: Math.round(avgDailyRevenue),
        maxDailyRevenue,
        daysTracked: revenueData?.length || 0
      },
      chartData: revenueData?.map(record => ({
        date: record.date,
        revenue_sats: record.revenue_sats,
        revenue_usd: record.revenue_usd,
        trading_fees_sats: record.trading_fees_sats,
        platform_fees_sats: record.platform_fees_sats,
        total_trades: record.total_trades
      })) || []
    });

  } catch (error) {
    console.error('❌ Error in get-daily-revenue API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
