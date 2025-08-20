import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';
import { getRevenueBalance } from '../../../utils/fetchTokenData';

export async function POST(request) {
  try {
    console.log('📊 API: Tracking sBTC fee pool changes...');
    
    // Check if fee pool amount is provided in request body (from home page)
    let currentFeePool;
    try {
      const body = await request.json();
      if (body.feePoolAmount && body.source === 'homepage-fetch') {
        currentFeePool = body.feePoolAmount;
        console.log('💰 Using fee pool amount from home page:', currentFeePool);
      } else {
        // Fetch current sBTC fee pool from blockchain
        currentFeePool = await getRevenueBalance();
      }
    } catch (error) {
      // If no body or parsing error, fetch from blockchain
      currentFeePool = await getRevenueBalance();
    }
    
    console.log('💰 Current sBTC fee pool:', currentFeePool, 'sats');
    
    // Get the last recorded fee pool amount to check for changes
    const { data: lastRecord, error: fetchError } = await supabaseServer
      .from('sbtc_fee_pool_history')
      .select('fee_pool_amount')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching last fee pool record:', fetchError);
      throw fetchError;
    }
    
    const lastAmount = lastRecord?.fee_pool_amount || 0;
    const hasChanged = currentFeePool !== lastAmount;
    
    // Calculate dynamic reward - use full fee pool amount
    const finalReward = currentFeePool; // Full sBTC fee pool amount = quiz reward
    
    // Only save if there's a change or if it's the first record
    if (hasChanged || !lastRecord) {
      const { data: newRecord, error: insertError } = await supabaseServer
        .from('sbtc_fee_pool_history')
        .insert({
          fee_pool_amount: currentFeePool
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error saving fee pool record:', insertError);
        throw insertError;
      }
      
             console.log('✅ Saved fee pool change:', {
         previous: lastAmount,
         current: currentFeePool,
         reward: finalReward
       });
       
       return NextResponse.json({
         success: true,
         saved: true,
         currentFeePool,
         previousAmount: lastAmount,
         calculatedReward: finalReward,
         record: newRecord
       });
     } else {
       console.log('📊 No change detected in fee pool');
       
       return NextResponse.json({
         success: true,
         saved: false,
         currentFeePool,
         previousAmount: lastAmount,
         calculatedReward: finalReward,
         message: 'No change detected'
       });
     }
    
  } catch (error) {
    console.error('❌ API: Error tracking fee pool changes:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to track fee pool changes',
      message: error.message
    }, { status: 500 });
  }
}

// GET endpoint to retrieve fee pool history
export async function GET() {
  try {
    const { data: history, error } = await supabaseServer
      .from('sbtc_fee_pool_history')
      .select('fee_pool_amount, recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(50); // Last 50 records
    
    if (error) {
      console.error('❌ Error fetching fee pool history:', error);
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      history: history || []
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching fee pool history:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fee pool history',
      message: error.message
    }, { status: 500 });
  }
}
