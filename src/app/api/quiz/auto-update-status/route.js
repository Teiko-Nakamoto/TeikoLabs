import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔄 Auto-updating competition status...');

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

    const endGoalThreshold = parseInt(endGoalSetting?.setting_value || '210000');

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

    let newStatus = 'active';
    let message = '';

    if (shouldEndCompetition) {
      newStatus = 'paused';
      message = `Competition paused - highest points (${highestPoints.toLocaleString()}) >= threshold (${endGoalThreshold.toLocaleString()})`;
    } else {
      newStatus = 'active';
      message = `Competition active - highest points (${highestPoints.toLocaleString()}) < threshold (${endGoalThreshold.toLocaleString()})`;
    }

    // Update competition status if it needs to change
    if (currentCompetitionStatus !== newStatus) {
      console.log(`🔄 Updating competition status from ${currentCompetitionStatus} to ${newStatus}`);
      
      const { error: updateError } = await supabaseServer
        .from('quiz_competition_status')
        .upsert({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error('❌ Error updating competition status:', updateError);
        throw updateError;
      }
      
      // Also update the competition_active setting
      const { error: settingError } = await supabaseServer
        .from('quiz_settings')
        .update({ setting_value: newStatus === 'active' ? 'true' : 'false' })
        .eq('setting_key', 'competition_active');
      
      if (settingError) {
        console.error('❌ Error updating competition setting:', settingError);
        throw settingError;
      }

      console.log(`✅ Competition status updated to: ${newStatus}`);
    } else {
      console.log(`✅ Competition status already correct: ${newStatus}`);
    }

    return NextResponse.json({
      success: true,
      message: message,
      previousStatus: currentCompetitionStatus,
      newStatus: newStatus,
      highestPoints,
      endGoalThreshold,
      statusChanged: currentCompetitionStatus !== newStatus
    });
    
  } catch (error) {
    console.error('❌ API: Error auto-updating competition status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to auto-update competition status',
      message: error.message
    }, { status: 500 });
  }
}
