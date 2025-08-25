import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔧 Setting competition status to active...');

    // Set competition status to active
    const { data: newStatus, error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .upsert({
        id: 1,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (statusError) {
      console.error('❌ Error setting competition status:', statusError);
      throw statusError;
    }

    // Also update the competition_active setting
    const { error: settingError } = await supabaseServer
      .from('quiz_settings')
      .update({ setting_value: 'true' })
      .eq('setting_key', 'competition_active');

    if (settingError) {
      console.error('❌ Error updating competition setting:', settingError);
      throw settingError;
    }

    console.log('✅ Competition status set to active:', newStatus);

    return NextResponse.json({
      success: true,
      message: 'Competition status set to active',
      newStatus: newStatus
    });
    
  } catch (error) {
    console.error('❌ API: Error setting competition status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to set competition status',
      message: error.message
    }, { status: 500 });
  }
}
