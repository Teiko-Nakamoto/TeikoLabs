import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔄 Resetting quiz competition...');
    
    // Reset all user quiz points to 0
    const { error: resetError } = await supabaseServer
      .from('user_quiz_points')
      .update({ points: 0 });
    
    if (resetError) {
      console.error('❌ Error resetting user points:', resetError);
      throw resetError;
    }
    
    // Update quiz competition status to 'active'
    const { error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .upsert({ 
        status: 'active',
        updated_at: new Date().toISOString()
      });
    
    if (statusError) {
      console.error('❌ Error updating quiz status:', statusError);
      throw statusError;
    }
    
    console.log('✅ Quiz competition reset successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Quiz competition reset successfully. All user points cleared and competition restarted.'
    });
    
  } catch (error) {
    console.error('❌ API: Error resetting quiz competition:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset quiz competition',
      message: error.message
    }, { status: 500 });
  }
}

