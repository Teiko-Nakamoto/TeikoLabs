import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔧 Fixing competition status...');

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

    // Check if any user has reached or exceeded the threshold
    const highestPoints = allUsers.length > 0 ? allUsers[0].total_points : 0;
    const shouldEndCompetition = highestPoints >= endGoalThreshold;

    console.log('📊 Competition status check:', {
      endGoalThreshold,
      highestPoints,
      shouldEndCompetition,
      totalUsers: allUsers.length
    });

    // Get current competition status
    const { data: currentStatus, error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .select('status')
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      console.error('❌ Error fetching current status:', statusError);
      throw statusError;
    }

    const currentCompetitionStatus = currentStatus?.status || 'active';
    console.log('📊 Current competition status:', currentCompetitionStatus);

    if (shouldEndCompetition && currentCompetitionStatus === 'active') {
      console.log(`🏆 Competition should be ended! Highest points: ${highestPoints.toLocaleString()} (threshold: ${endGoalThreshold.toLocaleString()})`);
      
      // Pause the quiz competition
      const { error: pauseError } = await supabaseServer
        .from('quiz_competition_status')
        .upsert({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        });
      
      if (pauseError) {
        console.error('❌ Error pausing quiz competition:', pauseError);
        throw pauseError;
      }
      
      // Also update the competition_active setting
      const { error: settingError } = await supabaseServer
        .from('quiz_settings')
        .update({ setting_value: 'false' })
        .eq('setting_key', 'competition_active');
      
      if (settingError) {
        console.error('❌ Error updating competition setting:', settingError);
        throw settingError;
      }

      return NextResponse.json({
        success: true,
        message: 'Competition status fixed - now paused',
        previousStatus: currentCompetitionStatus,
        newStatus: 'paused',
        highestPoints,
        endGoalThreshold,
        winner: allUsers[0]
      });
    } else if (shouldEndCompetition && currentCompetitionStatus === 'paused') {
      return NextResponse.json({
        success: true,
        message: 'Competition status is already correct - paused',
        status: 'paused',
        highestPoints,
        endGoalThreshold
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Competition should remain active',
        status: 'active',
        highestPoints,
        endGoalThreshold
      });
    }
    
  } catch (error) {
    console.error('❌ API: Error fixing competition status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fix competition status',
      message: error.message
    }, { status: 500 });
  }
}
