import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🧪 Testing reset functionality...');
    
    // Test 1: Check if user_points table exists and has data
    const { data: userPointsData, error: userPointsError } = await supabaseServer
      .from('user_points')
      .select('count')
      .limit(1);
    
    if (userPointsError) {
      console.error('❌ user_points table error:', userPointsError);
      return NextResponse.json({
        success: false,
        error: 'user_points table error',
        message: userPointsError.message
      }, { status: 500 });
    }
    
    console.log('✅ user_points table accessible');
    
    // Test 2: Check if quiz_attempts table exists
    const { data: attemptsData, error: attemptsError } = await supabaseServer
      .from('quiz_attempts')
      .select('count')
      .limit(1);
    
    if (attemptsError) {
      console.error('❌ quiz_attempts table error:', attemptsError);
      return NextResponse.json({
        success: false,
        error: 'quiz_attempts table error',
        message: attemptsError.message
      }, { status: 500 });
    }
    
    console.log('✅ quiz_attempts table accessible');
    
    // Test 3: Check if quiz_competition_status table exists
    const { data: statusData, error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .select('*')
      .limit(1);
    
    if (statusError) {
      console.error('❌ quiz_competition_status table error:', statusError);
      return NextResponse.json({
        success: false,
        error: 'quiz_competition_status table error',
        message: statusError.message
      }, { status: 500 });
    }
    
    console.log('✅ quiz_competition_status table accessible');
    
    // Test 4: Check if quiz_settings table exists
    const { data: settingsData, error: settingsError } = await supabaseServer
      .from('quiz_settings')
      .select('*')
      .eq('setting_key', 'total_points_earned')
      .limit(1);
    
    if (settingsError) {
      console.error('❌ quiz_settings table error:', settingsError);
      return NextResponse.json({
        success: false,
        error: 'quiz_settings table error',
        message: settingsError.message
      }, { status: 500 });
    }
    
    console.log('✅ quiz_settings table accessible');
    
    return NextResponse.json({
      success: true,
      message: 'All tables are accessible',
      tables: {
        user_points: 'accessible',
        quiz_attempts: 'accessible', 
        quiz_competition_status: 'accessible',
        quiz_settings: 'accessible'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in test reset API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test reset',
      message: error.message
    }, { status: 500 });
  }
}
