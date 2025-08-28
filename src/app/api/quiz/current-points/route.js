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

    const endGoalThreshold = parseInt(endGoalSetting?.setting_value);
    
    if (!endGoalSetting || !endGoalThreshold) {
      console.error('❌ No end goal threshold found in database');
      return NextResponse.json({
        success: false,
        error: 'No end goal threshold configured in database'
      }, { status: 400 });
    }

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

    // Check the actual competition status from database
    const { data: statusData, error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .select('status')
      .single();

    const competitionStatus = statusData?.status || 'active';
    // Only check end goal threshold if competition status is 'active' and not manually overridden
    const isCompetitionEnded = competitionStatus === 'ended';

    console.log('📊 Current points:', {
      endGoalThreshold,
      highestPoints,
      topUser: topUser?.wallet_address,
      totalUsers: allUsers.length,
      competitionStatus,
      isCompetitionEnded
    });

    return NextResponse.json({
      success: true,
      highestPoints,
      endGoalThreshold,
      topUser: topUser?.wallet_address,
      totalUsers: allUsers.length,
      competitionStatus,
      isCompetitionEnded
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
