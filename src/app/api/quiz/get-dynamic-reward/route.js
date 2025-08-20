import { NextResponse } from 'next/server';
import { getRevenueBalance } from '../../../utils/fetchTokenData';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🎯 API: Getting dynamic quiz reward based on sBTC fee pool...');
    
    // Get the latest fee pool data from database first
    let sbtcFeePool = 0;
    try {
      const { data: latestRecord, error } = await supabaseServer
        .from('sbtc_fee_pool_history')
        .select('fee_pool_amount')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && latestRecord) {
        sbtcFeePool = latestRecord.fee_pool_amount;
        console.log('💰 Using latest fee pool from database:', sbtcFeePool);
      } else {
        // Fallback to blockchain call if no database record
        sbtcFeePool = await getRevenueBalance();
        console.log('💰 Using fee pool from blockchain:', sbtcFeePool);
      }
    } catch (error) {
      // Fallback to blockchain call if database query fails
      try {
        sbtcFeePool = await getRevenueBalance();
        console.log('💰 Using fee pool from blockchain (fallback):', sbtcFeePool);
      } catch (blockchainError) {
        console.error('❌ Both database and blockchain calls failed:', blockchainError);
        // Final fallback to a reasonable default
        sbtcFeePool = 10000; // 10,000 sats as fallback
        console.log('💰 Using fallback fee pool amount:', sbtcFeePool);
      }
    }
    
    console.log('💰 Current sBTC fee pool:', sbtcFeePool, 'sats');
    
    // Calculate dynamic reward based on fee pool
    // Formula: Current sBTC fee pool amount = quiz reward
    const finalReward = sbtcFeePool; // Use the full fee pool amount as reward
    
    console.log('🎯 Calculated dynamic reward:', {
      sbtcFeePool,
      finalReward
    });
    
    // Note: Fee pool tracking is handled by the home page, not here
    
    return NextResponse.json({
      success: true,
      reward: finalReward,
      sbtcFeePool,
      calculation: {
        sbtcFeePool,
        rewardType: 'full_fee_pool'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Error getting dynamic reward:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sBTC fee pool data',
      message: error.message
    }, { status: 500 });
  }
}
