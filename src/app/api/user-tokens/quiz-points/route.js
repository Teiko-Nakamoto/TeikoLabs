import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required'
      }, { status: 400 });
    }
    
    console.log('📊 Fetching quiz points for address:', address);
    
    // Get user's quiz points from the user_points table
    const { data: userData, error } = await supabaseServer
      .from('user_points')
      .select('total_points')
      .eq('wallet_address', address)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching user quiz points:', error);
      throw error;
    }
    
    const points = userData?.total_points || 0;
    
    console.log('✅ User quiz points:', points);
    
    return NextResponse.json({
      success: true,
      points: points,
      address: address
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching user quiz points:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user quiz points',
      message: error.message
    }, { status: 500 });
  }
}

