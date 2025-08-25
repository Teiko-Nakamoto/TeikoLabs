import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔄 Manually pausing competition...');
    
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

    console.log('✅ Competition manually paused successfully');

    return NextResponse.json({
      success: true,
      message: 'Competition has been paused',
      status: 'paused'
    });
    
  } catch (error) {
    console.error('❌ API: Error pausing competition:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to pause competition',
      message: error.message
    }, { status: 500 });
  }
}
