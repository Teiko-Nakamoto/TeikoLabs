import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔧 Fixing competition active setting...');

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

    // Check if any user has reached or exceeded the threshold
    const highestPoints = allUsers.length > 0 ? allUsers[0].total_points : 0;
    const shouldBeActive = highestPoints < endGoalThreshold;

    console.log('📊 Competition active check:', {
      endGoalThreshold,
      highestPoints,
      shouldBeActive,
      totalUsers: allUsers.length
    });

    // Get current competition active setting
    const { data: currentSetting, error: currentError } = await supabaseServer
      .from('quiz_settings')
      .select('setting_value')
      .eq('setting_key', 'competition_active')
      .single();

    if (currentError) {
      console.error('❌ Error fetching current setting:', currentError);
      throw currentError;
    }

    const currentActive = currentSetting?.setting_value === 'true';
    const newActiveValue = shouldBeActive ? 'true' : 'false';

    console.log('📊 Current vs new active setting:', {
      currentActive,
      newActiveValue,
      needsUpdate: currentActive !== shouldBeActive
    });

    // Update the setting if it needs to change
    if (currentActive !== shouldBeActive) {
      console.log(`🔄 Updating competition_active from ${currentActive} to ${shouldBeActive}`);
      
      const { error: updateError } = await supabaseServer
        .from('quiz_settings')
        .update({ setting_value: newActiveValue })
        .eq('setting_key', 'competition_active');
      
      if (updateError) {
        console.error('❌ Error updating competition active setting:', updateError);
        throw updateError;
      }

      console.log(`✅ Competition active setting updated to: ${newActiveValue}`);
    } else {
      console.log(`✅ Competition active setting already correct: ${newActiveValue}`);
    }

    // Also update the competition status table
    const newStatus = shouldBeActive ? 'active' : 'paused';
    
    const { error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .upsert({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
    
    if (statusError) {
      console.error('❌ Error updating competition status:', statusError);
      throw statusError;
    }

    return NextResponse.json({
      success: true,
      message: `Competition active setting fixed - should be ${shouldBeActive ? 'active' : 'paused'} (${highestPoints.toLocaleString()} < ${endGoalThreshold.toLocaleString()})`,
      previousActive: currentActive,
      newActive: shouldBeActive,
      highestPoints,
      endGoalThreshold,
      statusChanged: currentActive !== shouldBeActive
    });
    
  } catch (error) {
    console.error('❌ API: Error fixing competition active setting:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fix competition active setting',
      message: error.message
    }, { status: 500 });
  }
}
