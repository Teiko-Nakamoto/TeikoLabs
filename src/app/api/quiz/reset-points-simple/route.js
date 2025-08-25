import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔄 Simple reset: Resetting user points only...');
    
    // Only reset user points to 0
    const { data, error } = await supabaseServer
      .from('user_points')
      .update({
        total_points: 0,
        perfect_quizzes: 0,
        total_quizzes_attempted: 0,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error resetting user points:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to reset user points',
        message: error.message
      }, { status: 500 });
    }

    console.log('✅ Successfully reset user points');
    
    return NextResponse.json({
      success: true,
      message: 'User points have been reset successfully'
    });
    
  } catch (error) {
    console.error('❌ API: Error in simple reset:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset points',
      message: error.message
    }, { status: 500 });
  }
}
