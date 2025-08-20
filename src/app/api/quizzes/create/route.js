import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST(request) {
  try {
    const { title, maxQuestions = 6 } = await request.json();
    
    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    console.log('📝 API: Creating new quiz:', { title, maxQuestions });
    
    const { data, error } = await supabaseServer
      .from('quizzes')
      .insert({
        title,
        max_questions: maxQuestions,
        points_per_correct_answer: Math.round(21 / maxQuestions) // Fixed 21 points total for quiz completion
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error creating quiz:', error);
      throw error;
    }

    console.log('✅ API: Successfully created quiz:', data);
    return NextResponse.json({ success: true, quiz: data });
    
  } catch (error) {
    console.error('❌ API: Error creating quiz:', error);
    return NextResponse.json({ 
      error: 'Failed to create quiz', 
      message: error.message 
    }, { status: 500 });
  }
}
