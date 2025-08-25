import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔧 Initializing competition status...');

    // First, check if the table has any data
    const { data: existingStatus, error: checkError } = await supabaseServer
      .from('quiz_competition_status')
      .select('*')
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking competition status:', checkError);
      throw checkError;
    }

    if (existingStatus && existingStatus.length > 0) {
      console.log('✅ Competition status table already has data');
      return NextResponse.json({
        success: true,
        message: 'Competition status table already initialized',
        existingData: existingStatus[0]
      });
    }

    // Get current competition active setting
    const { data: activeSetting, error: activeError } = await supabaseServer
      .from('quiz_settings')
      .select('setting_value')
      .eq('setting_key', 'competition_active')
      .single();

    if (activeError) {
      console.error('❌ Error fetching competition active setting:', activeError);
      throw activeError;
    }

    const isActive = activeSetting?.setting_value === 'true';
    const initialStatus = isActive ? 'active' : 'paused';

    console.log('📊 Initializing competition status:', {
      isActive,
      initialStatus,
      activeSettingValue: activeSetting?.setting_value
    });

    console.log('📊 Initializing with status:', initialStatus);

    // Insert initial status - use upsert to handle existing records
    const { data: newStatus, error: insertError } = await supabaseServer
      .from('quiz_competition_status')
      .upsert({
        id: 1, // Use a specific ID to ensure we update existing record
        status: initialStatus,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting initial status:', insertError);
      throw insertError;
    }

    console.log('✅ Competition status initialized:', newStatus);

    return NextResponse.json({
      success: true,
      message: `Competition status initialized as: ${initialStatus}`,
      newStatus: newStatus
    });
    
  } catch (error) {
    console.error('❌ API: Error initializing competition status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize competition status',
      message: error.message
    }, { status: 500 });
  }
}
