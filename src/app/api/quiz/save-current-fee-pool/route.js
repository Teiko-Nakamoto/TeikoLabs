import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';
import { getRevenueBalance } from '../../../utils/fetchTokenData';

export async function POST() {
  try {
    console.log('💾 API: Manually saving current fee pool data...');
    
    // Get current fee pool from blockchain (fresh call, no cache)
    const currentFeePool = await getRevenueBalance();
    
    console.log('💰 Current fee pool from blockchain:', currentFeePool, 'sats');
    
    if (currentFeePool <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid fee pool data available'
      }, { status: 400 });
    }
    
    // Calculate dynamic reward
    const baseReward = 10;
    const feePercentage = 0.0001;
    const dynamicReward = Math.floor(baseReward + (currentFeePool * feePercentage));
    const maxReward = 1000;
    const finalReward = Math.min(dynamicReward, maxReward);
    
    // Save to database
    const { data: newRecord, error: insertError } = await supabaseServer
      .from('sbtc_fee_pool_history')
      .insert({
        fee_pool_amount: currentFeePool,
        previous_amount: 0, // First record
        change_amount: currentFeePool,
        change_percentage: 0,
        calculated_reward: finalReward,
        reward_calculation: {
          baseReward,
          feePercentage,
          dynamicReward,
          maxReward,
          finalReward
        },
        blockchain_timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error saving fee pool record:', insertError);
      throw insertError;
    }
    
    console.log('✅ Successfully saved current fee pool data:', {
      feePool: currentFeePool,
      reward: finalReward,
      recordId: newRecord.id
    });
    
    return NextResponse.json({
      success: true,
      feePool: currentFeePool,
      reward: finalReward,
      record: newRecord
    });
    
  } catch (error) {
    console.error('❌ API: Error saving current fee pool:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save current fee pool data',
      message: error.message
    }, { status: 500 });
  }
}
