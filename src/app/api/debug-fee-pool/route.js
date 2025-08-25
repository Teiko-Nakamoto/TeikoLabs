import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking fee pool history...');
    
    // Get all fee pool history records
    const { data: history, error } = await supabaseServer
      .from('sbtc_fee_pool_history')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('❌ Error fetching fee pool history:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch fee pool history',
        message: error.message
      }, { status: 500 });
    }
    
    console.log('📊 Fee pool history records:', history);
    
    // Look for suspicious values (like 494.4K)
    const suspiciousRecords = history.filter(record => 
      record.fee_pool_amount > 100000 || // Over 100K
      record.fee_pool_amount < 1000      // Under 1K
    );
    
    return NextResponse.json({
      success: true,
      totalRecords: history.length,
      history: history,
      suspiciousRecords: suspiciousRecords,
      message: 'Fee pool history retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in debug fee pool API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to debug fee pool',
      message: error.message
    }, { status: 500 });
  }
}
