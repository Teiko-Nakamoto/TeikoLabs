import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    // Reset all user points to 0
    const { error: pointsError } = await supabaseServer
      .from('user_points')
      .update({
        total_points: 0,
        perfect_quizzes: 0,
        total_quizzes_attempted: 0,
        updated_at: new Date().toISOString()
      });

    if (pointsError) {
      console.error('❌ Error resetting user points:', pointsError);
      throw pointsError;
    }

    // Clear all quiz attempts
    const { error: attemptsError } = await supabaseServer
      .from('quiz_attempts')
      .delete()
      .neq('id', 0); // Delete all records

    if (attemptsError) {
      console.error('❌ Error clearing quiz attempts:', attemptsError);
      throw attemptsError;
    }

    // Reset competition status to active
    const { error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      });

    if (statusError) {
      console.error('❌ Error resetting competition status:', statusError);
      throw statusError;
    }

    // Reset global total points to 0
    const { error: globalError } = await supabaseServer
      .from('quiz_settings')
      .update({ setting_value: '0' })
      .eq('setting_key', 'total_points_earned');

    if (globalError) {
      console.error('❌ Error resetting global total:', globalError);
      throw globalError;
    }

    console.log('✅ Successfully reset all user points and quiz history');
    
    return NextResponse.json({
      success: true,
      message: 'All user points and quiz history have been reset successfully'
    });
    
  } catch (error) {
    console.error('❌ API: Error resetting points:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset points',
      message: error.message
    }, { status: 500 });
  }
}
