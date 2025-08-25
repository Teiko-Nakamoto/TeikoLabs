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

    // Randomize and limit questions using proper Fisher-Yates shuffle
    const shuffledQuestions = [...allQuestions];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
    }
    const questions = shuffledQuestions.slice(0, quiz.max_questions);

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this quiz' }, { status: 404 });
    }

    // Format questions with shuffled answers using Fisher-Yates shuffle
    const formattedQuestions = questions.map(q => {
      const answers = [
        q.correct_answer,
        q.wrong_answer_1,
        q.wrong_answer_2,
        q.wrong_answer_3
      ];
      
      // Fisher-Yates shuffle for better randomization
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }

      return {
        id: q.id,
        questionText: q.question_text,
        correctAnswer: q.correct_answer,
        answers: answers
      };
    });

    console.log('✅ API: Successfully fetched questions:', formattedQuestions.length);
    console.log('🎲 Questions randomized:', questions.length, 'out of', allQuestions.length, 'total questions');
    console.log('🎲 Answer positions randomized for each question');
    
    // Log the first few questions to verify randomization
    console.log('🎲 First 3 questions (randomized):', formattedQuestions.slice(0, 3).map(q => ({
      id: q.id,
      question: q.questionText.substring(0, 50) + '...',
      answers: q.answers
    })));
    
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
    console.error('❌ API: Error fetching quiz questions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch quiz questions', 
      message: error.message 
    }, { status: 500 });
  }
}
