import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../utils/supabaseServer';

export async function GET(request, { params }) {
  try {
    const { quizId } = params;
    
    console.log('📝 API: Fetching questions for quiz management:', quizId);
    
    // Get quiz details
    const { data: quiz, error: quizError } = await supabaseServer
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('is_active', true)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found or inactive' }, { status: 404 });
    }

    // Get all questions for this quiz
    const { data: allQuestions, error: questionsError } = await supabaseServer
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('❌ Database error fetching questions:', questionsError);
      throw questionsError;
    }

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        questions: [],
        message: 'No questions found for this quiz' 
      });
    }

    // Format questions WITHOUT shuffling answers (for management view)
    const formattedQuestions = allQuestions.map(q => {
      const answers = [
        q.correct_answer,
        q.wrong_answer_1,
        q.wrong_answer_2,
        q.wrong_answer_3
      ];

      return {
        id: q.id,
        questionText: q.question_text,
        correctAnswer: q.correct_answer,
        answers: answers
      };
    });

    console.log('✅ API: Successfully fetched questions for management:', formattedQuestions.length);
    
    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        maxQuestions: quiz.max_questions,
        timePerQuestion: quiz.time_per_question,
        pointsPerCorrectAnswer: quiz.points_per_correct_answer
      },
      questions: formattedQuestions
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching quiz questions for management:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch quiz questions', 
      message: error.message 
    }, { status: 500 });
  }
}
