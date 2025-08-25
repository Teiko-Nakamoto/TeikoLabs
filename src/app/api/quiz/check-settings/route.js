import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Checking quiz settings...');

    // Get competition settings
    const { data: settings, error: settingsError } = await supabaseServer
      .from('quiz_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['competition_active', 'competition_end_threshold']);

    if (settingsError) {
      console.error('❌ Error checking competition settings:', settingsError);
      throw settingsError;
    }

    // Get competition status
    const { data: statusData, error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .select('status, updated_at')
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      console.error('❌ Error checking competition status:', statusError);
      throw statusError;
    }

    const competitionActive = settings.find(s => s.setting_key === 'competition_active')?.setting_value;
    const endGoalThreshold = settings.find(s => s.setting_key === 'competition_end_threshold')?.setting_value;
    const competitionStatus = statusData?.status || 'not_set';

    console.log('📊 Current settings:', {
      competitionActive,
      endGoalThreshold,
      competitionStatus,
      statusUpdatedAt: statusData?.updated_at
    });

    return NextResponse.json({
      success: true,
      settings: {
        competitionActive,
        endGoalThreshold,
        competitionStatus,
        statusUpdatedAt: statusData?.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ API: Error checking settings:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check settings',
      message: error.message
    }, { status: 500 });
  }
}
