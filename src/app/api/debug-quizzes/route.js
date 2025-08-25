import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET(request) {
  try {
    console.log('🔍 Debug: Checking all quizzes...');
    
    // Get all quizzes
    const { data: quizzes, error: quizzesError } = await supabaseServer
      .from('quizzes')
      .select('*')
      .eq('is_active', true)
      .order('id');

    if (quizzesError) {
      console.error('❌ Quiz query error:', quizzesError);
      throw quizzesError;
    }

    console.log('🔍 Raw quizzes data:', quizzes);

    if (!quizzes || quizzes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active quizzes found in database',
        totalQuizzes: 0,
        totalQuestions: 0,
        quizDetails: []
      });
    }

    // Get all questions with their quiz associations
    const { data: questions, error: questionsError } = await supabaseServer
      .from('quiz_questions')
      .select('*')
      .order('quiz_id');

    if (questionsError) {
      console.error('❌ Questions query error:', questionsError);
      throw questionsError;
    }

    console.log('🔍 Raw questions data:', questions);

    // Group questions by quiz
    const quizDetails = quizzes.map(quiz => {
      const quizQuestions = questions ? questions.filter(q => q.quiz_id === quiz.id) : [];
      return {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description
        },
        questionCount: quizQuestions.length,
        questions: quizQuestions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          quiz_id: q.quiz_id
        }))
      };
    });

    console.log('🔍 Quiz details:', quizDetails);

    return NextResponse.json({
      success: true,
      totalQuizzes: quizzes.length,
      totalQuestions: questions ? questions.length : 0,
      quizDetails: quizDetails,
      rawQuizzes: quizzes,
      rawQuestions: questions
    });
    
  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json({ 
      error: 'Failed to debug quizzes', 
      message: error.message,
      details: error
    }, { status: 500 });
  }
}
