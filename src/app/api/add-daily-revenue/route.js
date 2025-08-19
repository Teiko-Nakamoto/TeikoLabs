// API Route: Add Daily Revenue Data (Admin Only)
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function POST(request) {
  try {
    // Get the request body
    const body = await request.json();
    const { date, revenue_sats, revenue_usd, trading_fees_sats, platform_fees_sats, total_trades, avg_trade_size_sats, notes } = body;

    // Validate required fields
    if (!date || !revenue_sats || revenue_sats <= 0) {
      return NextResponse.json(
        { error: 'Invalid data. Date and revenue_sats are required and revenue_sats must be positive.' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    // Check if date is not in the future
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return NextResponse.json(
        { error: 'Cannot add revenue for future dates.' },
        { status: 400 }
      );
    }

    console.log('🔍 Adding daily revenue data:', {
      date,
      revenue_sats,
      revenue_usd,
      trading_fees_sats,
      platform_fees_sats,
      total_trades,
      avg_trade_size_sats,
      notes
    });

    // Prepare the data for insertion
    const revenueData = {
      date,
      revenue_sats: parseInt(revenue_sats),
      revenue_usd: parseFloat(revenue_usd || 0),
      trading_fees_sats: parseInt(trading_fees_sats || 0),
      platform_fees_sats: parseInt(platform_fees_sats || 0),
      total_trades: parseInt(total_trades || 0),
      avg_trade_size_sats: parseInt(avg_trade_size_sats || 0),
      notes: notes || 'Added by admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert or update the revenue data
    const { data, error } = await supabaseServer
      .from('daily_revenue')
      .upsert([revenueData], { 
        onConflict: 'date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Error inserting revenue data:', error);
      return NextResponse.json(
        { error: 'Failed to add revenue data', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Revenue data added successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Revenue data added successfully',
      data: data[0]
    });

  } catch (error) {
    console.error('❌ Error in add-daily-revenue API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
