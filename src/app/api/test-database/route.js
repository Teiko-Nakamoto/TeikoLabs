import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Test: Checking database connection...');
    
    // Simple test query
    const { data, error } = await supabaseServer
      .from('sbtc_fee_pool_history')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        message: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: data
    });
    
  } catch (error) {
    console.error('❌ Error in test database API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test database',
      message: error.message
    }, { status: 500 });
  }
}

