import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('🔍 API: Received request body:', body);
    
    const { 
      quizId, 
      questionText, 
      correctAnswer, 
      wrongAnswer1, 
      wrongAnswer2, 
      wrongAnswer3
    } = body;
    
    // Validate required fields
    if (!quizId || !questionText || !correctAnswer || !wrongAnswer1 || !wrongAnswer2 || !wrongAnswer3) {
      console.log('❌ API: Missing required fields:', { quizId, questionText, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3 });
      return NextResponse.json({ 
        error: 'All fields are required: quizId, questionText, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3' 
      }, { status: 400 });
    }
    
    console.log('📝 API: Adding question to quiz:', { quizId });
    
    const insertData = {
      quiz_id: quizId,
      question_text: questionText,
      correct_answer: correctAnswer,
      wrong_answer_1: wrongAnswer1,
      wrong_answer_2: wrongAnswer2,
      wrong_answer_3: wrongAnswer3,
      question_order: 1
    };
    
    console.log('📝 API: Inserting data:', insertData);
    
    const { data, error } = await supabaseServer
      .from('quiz_questions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error adding question:', error);
      console.error('❌ Error details:', {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code
      });
      throw error;
    }

    console.log('✅ API: Successfully added question:', data);
    return NextResponse.json({ success: true, question: data });
    
  } catch (error) {
    console.error('❌ API: Error adding question:', error);
    return NextResponse.json({ 
      error: 'Failed to add question', 
      message: error.message 
    }, { status: 500 });
  }
}
