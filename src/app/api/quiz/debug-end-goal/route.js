import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking quiz end goal setting');
    
    // Get all quiz settings to see what's in the database
    const { data: allSettings, error: allError } = await supabaseServer
      .from('quiz_settings')
      .select('*')
      .order('setting_key');

    if (allError) {
      console.error('❌ Database error fetching all settings:', allError);
      throw allError;
    }

    console.log('📊 All quiz settings:', allSettings);

    // Get specific end goal setting
    const { data: endGoalSetting, error: endGoalError } = await supabaseServer
      .from('quiz_settings')
      .select('setting_key, setting_value')
      .eq('setting_key', 'competition_end_threshold')
      .single();

    if (endGoalError) {
      console.error('❌ Database error fetching end goal:', endGoalError);
      
      // Try to create the setting if it doesn't exist
      console.log('🔄 Attempting to create missing end goal setting...');
      const { data: insertData, error: insertError } = await supabaseServer
        .from('quiz_settings')
        .insert({
          setting_key: 'competition_end_threshold',
          setting_value: '21000000'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create end goal setting:', insertError);
        throw insertError;
      }

      console.log('✅ Created end goal setting:', insertData);
      
      return NextResponse.json({
        success: true,
        endGoal: 21000000,
        message: 'Created missing end goal setting',
        allSettings: allSettings,
        created: true
      });
    }

    const endGoal = parseInt(endGoalSetting?.setting_value || '21000000');
    
    console.log('✅ Current end goal:', endGoal);
    
    return NextResponse.json({
      success: true,
      endGoal: endGoal,
      allSettings: allSettings,
      endGoalSetting: endGoalSetting
    });
    
  } catch (error) {
    console.error('❌ Debug API Error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

