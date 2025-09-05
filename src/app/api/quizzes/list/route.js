import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('📝 API: Fetching quizzes list');
    
    const { data, error } = await supabaseServer
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        is_active,
        is_visible,
        max_questions,
        time_per_question,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // Get actual question count for each quiz
    if (data && data.length > 0) {
      for (let quiz of data) {
        const { data: questionCount, error: countError } = await supabaseServer
          .from('quiz_questions')
          .select('id', { count: 'exact' })
          .eq('quiz_id', quiz.id);
        
        if (!countError) {
          quiz.actual_question_count = questionCount?.length || 0;
        } else {
          quiz.actual_question_count = 0;
        }
      }
    }

    if (error) {
      console.error('❌ Database error fetching quizzes:', error);
      throw error;
    }

    console.log('✅ API: Successfully fetched quizzes:', data?.length || 0);
    return NextResponse.json({ success: true, quizzes: data || [] });
    
  } catch (error) {
    console.error('❌ API: Error fetching quizzes:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch quizzes', 
      message: error.message 
    }, { status: 500 });
  }
}
