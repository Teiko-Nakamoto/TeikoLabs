import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🧹 Cleaning up redundant quiz settings...');
    
    // Get all current settings
    const { data: allSettings, error: allError } = await supabaseServer
      .from('quiz_settings')
      .select('*')
      .order('setting_key');

    if (allError) {
      console.error('❌ Database error fetching settings:', allError);
      throw allError;
    }

    console.log('📊 Current settings before cleanup:', allSettings);

    // Remove the redundant competition_active setting
    const { error: deleteError } = await supabaseServer
      .from('quiz_settings')
      .delete()
      .eq('setting_key', 'competition_active');

    if (deleteError) {
      console.error('❌ Error deleting competition_active setting:', deleteError);
      throw deleteError;
    }

    console.log('✅ Successfully removed redundant competition_active setting');

    // Get updated settings
    const { data: updatedSettings, error: updatedError } = await supabaseServer
      .from('quiz_settings')
      .select('*')
      .order('setting_key');

    if (updatedError) {
      console.error('❌ Error fetching updated settings:', updatedError);
      throw updatedError;
    }

    console.log('📊 Settings after cleanup:', updatedSettings);

    return NextResponse.json({
      success: true,
      message: 'Successfully cleaned up redundant competition_active setting',
      removedSetting: 'competition_active',
      remainingSettings: updatedSettings,
      note: 'Competition status is now managed by quiz_competition_status table only'
    });
    
  } catch (error) {
    console.error('❌ API: Error cleaning up settings:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clean up settings',
      message: error.message
    }, { status: 500 });
  }
}

