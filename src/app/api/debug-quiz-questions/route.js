import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET(request) {
  try {
    console.log('🔍 Debug: Checking all quiz questions...');
    
    // Get all quizzes
    const { data: quizzes, error: quizzesError } = await supabaseServer
      .from('quizzes')
      .select('*')
      .eq('is_active', true);

    if (quizzesError) {
      throw quizzesError;
    }

    // Get all questions
    const { data: questions, error: questionsError } = await supabaseServer
      .from('quiz_questions')
      .select('*');

    if (questionsError) {
      throw questionsError;
    }

    // Group questions by quiz
    const quizQuestions = {};
    
    quizzes.forEach(quiz => {
      quizQuestions[quiz.id] = {
        quiz: quiz,
        questions: questions.filter(q => q.quiz_id === quiz.id)
      };
    });

    // Find the "What is 2 + 2?" question
    const testQuestion = questions.find(q => 
      q.question_text && q.question_text.toLowerCase().includes('what is 2 + 2')
    );

    console.log('🔍 Debug results:', {
      totalQuizzes: quizzes.length,
      totalQuestions: questions.length,
      testQuestionFound: !!testQuestion,
      testQuestionDetails: testQuestion ? {
        id: testQuestion.id,
        quiz_id: testQuestion.quiz_id,
        question_text: testQuestion.question_text
      } : null,
      quizQuestions: quizQuestions
    });

    return NextResponse.json({
      success: true,
      totalQuizzes: quizzes.length,
      totalQuestions: questions.length,
      testQuestionFound: !!testQuestion,
      testQuestionDetails: testQuestion ? {
        id: testQuestion.id,
        quiz_id: testQuestion.quiz_id,
        question_text: testQuestion.question_text
      } : null,
      quizQuestions: quizQuestions
    });
    
  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json({ 
      error: 'Failed to debug quiz questions', 
      message: error.message 
    }, { status: 500 });
  }
}
