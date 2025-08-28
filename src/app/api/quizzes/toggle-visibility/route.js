import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST(request) {
  try {
    console.log('📝 API: Toggling quiz visibility');
    
    const { quizId, isVisible } = await request.json();
    
    if (!quizId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Quiz ID is required' 
      }, { status: 400 });
    }

    // Update the quiz visibility
    const { data, error } = await supabaseServer
      .from('quizzes')
      .update({ is_visible: isVisible })
      .eq('id', quizId)
      .select();

    if (error) {
      console.error('❌ Database error updating quiz visibility:', error);
      throw error;
    }

    console.log('✅ API: Successfully toggled quiz visibility:', { quizId, isVisible });
    return NextResponse.json({ 
      success: true, 
      message: `Quiz ${isVisible ? 'shown' : 'hidden'} successfully`,
      quiz: data[0]
    });
    
  } catch (error) {
    console.error('❌ API: Error toggling quiz visibility:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to toggle quiz visibility', 
      message: error.message 
    }, { status: 500 });
  }
}
