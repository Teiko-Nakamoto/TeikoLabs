import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    console.log('🔧 Fix: Starting quiz question fix...');
    
    // Get all quizzes to find the test quiz
    const { data: quizzes, error: quizzesError } = await supabaseServer
      .from('quizzes')
      .select('*')
      .eq('is_active', true);

    if (quizzesError) {
      throw quizzesError;
    }

    // Find the test quiz (usually has "test" in the title)
    const testQuiz = quizzes.find(q => 
      q.title && q.title.toLowerCase().includes('test')
    );

    // Find the "What is 2 + 2?" question
    const { data: testQuestions, error: questionsError } = await supabaseServer
      .from('quiz_questions')
      .select('*')
      .ilike('question_text', '%what is 2 + 2%');

    if (questionsError) {
      throw questionsError;
    }

    console.log('🔧 Found test questions:', testQuestions);
    console.log('🔧 Found test quiz:', testQuiz);

    if (action === 'move_to_test_quiz' && testQuiz && testQuestions.length > 0) {
      // Move the test question to the test quiz
      const { error: updateError } = await supabaseServer
        .from('quiz_questions')
        .update({ quiz_id: testQuiz.id })
        .in('id', testQuestions.map(q => q.id));

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Moved test questions to test quiz');
      return NextResponse.json({ 
        success: true, 
        message: `Moved ${testQuestions.length} test question(s) to test quiz`,
        movedQuestions: testQuestions.length
      });
    }

    if (action === 'delete_test_questions' && testQuestions.length > 0) {
      // Delete the test questions
      const { error: deleteError } = await supabaseServer
        .from('quiz_questions')
        .delete()
        .in('id', testQuestions.map(q => q.id));

      if (deleteError) {
        throw deleteError;
      }

      console.log('✅ Deleted test questions');
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${testQuestions.length} test question(s)`,
        deletedQuestions: testQuestions.length
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Debug info only',
      testQuiz: testQuiz,
      testQuestions: testQuestions,
      availableActions: ['move_to_test_quiz', 'delete_test_questions']
    });
    
  } catch (error) {
    console.error('❌ Fix API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix quiz questions', 
      message: error.message 
    }, { status: 500 });
  }
}
