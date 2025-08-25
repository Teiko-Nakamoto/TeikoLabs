import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🧹 Cleanup: Removing suspicious fee pool data...');
    
    // Remove records with suspicious values (like 494.4K)
    const { data: deletedRecords, error } = await supabaseServer
      .from('sbtc_fee_pool_history')
      .delete()
      .or('fee_pool_amount.gt.100000,fee_pool_amount.lt.1000') // Remove values > 100K or < 1K
      .select();
    
    if (error) {
      console.error('❌ Error cleaning up fee pool history:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to cleanup fee pool history',
        message: error.message
      }, { status: 500 });
    }
    
    console.log('✅ Cleaned up fee pool history:', deletedRecords);
    
    return NextResponse.json({
      success: true,
      deletedRecords: deletedRecords,
      deletedCount: deletedRecords?.length || 0,
      message: 'Suspicious fee pool data removed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in cleanup fee pool API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup fee pool',
      message: error.message
    }, { status: 500 });
  }
}
