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
        max_questions,
        time_per_question,
        points_per_correct_answer,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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
