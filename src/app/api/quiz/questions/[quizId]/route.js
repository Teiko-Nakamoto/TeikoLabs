import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../utils/supabaseServer';

export async function GET(request, { params }) {
  try {
    const { quizId } = params;
    
    console.log('📝 API: Fetching questions for quiz:', quizId);
    
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
      .eq('quiz_id', quizId);

    if (questionsError) {
      console.error('❌ Database error fetching questions:', questionsError);
      throw questionsError;
    }

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this quiz' }, { status: 404 });
    }

    // Randomize and limit questions
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    const questions = shuffledQuestions.slice(0, quiz.max_questions);

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this quiz' }, { status: 404 });
    }

    // Format questions with shuffled answers
    const formattedQuestions = questions.map(q => {
      const answers = [
        q.correct_answer,
        q.wrong_answer_1,
        q.wrong_answer_2,
        q.wrong_answer_3
      ].sort(() => Math.random() - 0.5); // Shuffle answers

      return {
        id: q.id,
        questionText: q.question_text,
        correctAnswer: q.correct_answer,
        answers: answers
      };
    });

    console.log('✅ API: Successfully fetched questions:', formattedQuestions.length);
    
    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        maxQuestions: quiz.max_questions,
        timePerQuestion: quiz.time_per_question
      },
      questions: formattedQuestions
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching quiz questions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch quiz questions', 
      message: error.message 
    }, { status: 500 });
  }
}
