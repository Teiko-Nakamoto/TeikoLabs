import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Getting current points...');

    // Get the current end goal threshold
    const { data: endGoalSetting, error: endGoalError } = await supabaseServer
      .from('quiz_settings')
      .select('setting_value')
      .eq('setting_key', 'competition_end_threshold')
      .single();

    if (endGoalError) {
      console.error('❌ Database error fetching end goal:', endGoalError);
      throw endGoalError;
    }

    const endGoalThreshold = parseInt(endGoalSetting?.setting_value || '220000');

    // Get all user points
    const { data: allUsers, error: allUsersError } = await supabaseServer
      .from('user_points')
      .select('wallet_address, total_points')
      .order('total_points', { ascending: false });

    if (allUsersError) {
      console.error('❌ Database error checking all user points:', allUsersError);
      throw allUsersError;
    }

    const highestPoints = allUsers.length > 0 ? allUsers[0].total_points : 0;
    const topUser = allUsers.length > 0 ? allUsers[0] : null;

    console.log('📊 Current points:', {
      endGoalThreshold,
      highestPoints,
      topUser: topUser?.wallet_address,
      totalUsers: allUsers.length
    });

    return NextResponse.json({
      success: true,
      highestPoints,
      endGoalThreshold,
      topUser: topUser?.wallet_address,
      totalUsers: allUsers.length,
      isCompetitionEnded: highestPoints >= endGoalThreshold
    });
    
  } catch (error) {
    console.error('❌ API: Error getting current points:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get current points',
      message: error.message
    }, { status: 500 });
  }
}
