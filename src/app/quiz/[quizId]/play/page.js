'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/header';
import Footer from '../../../components/footer';
import '../../quiz.css';

export default function QuizGame() {
  const { quizId } = useParams();
  const router = useRouter();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [quizInfo, setQuizInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading, playing, failed, completed
  const [connectedAddress, setConnectedAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get connected wallet address
    const address = localStorage.getItem('connectedAddress');
    setConnectedAddress(address || '');
    
    if (!address) {
      setError('Please connect your wallet to play quizzes');
      setLoading(false);
      return;
    }

    // Load quiz questions
    loadQuizQuestions();
  }, [quizId]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeUp();
    }
  }, [timeLeft, gameState]);

  const loadQuizQuestions = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching and ensure fresh randomization
      const timestamp = Date.now();
      const response = await fetch(`/api/quiz/questions/${quizId}?t=${timestamp}`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
        setQuizInfo(data.quiz);
        setTimeLeft(data.quiz.timePerQuestion);
        setGameState('playing');
      } else {
        setError(data.error || 'Failed to load quiz questions');
      }
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      setError('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (selectedAnswer) => {
    if (gameState !== 'playing') return;
    
    const currentQ = questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
      
      if (currentQuestion + 1 < questions.length) {
        // Move to next question
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(quizInfo.timePerQuestion);
      } else {
        // Quiz completed successfully
        await completeQuiz(true);
      }
    } else {
      // Wrong answer - quiz failed
      await completeQuiz(false);
    }
  };

  const handleTimeUp = async () => {
    await completeQuiz(false);
  };

  const completeQuiz = async (success) => {
    // Check if user got 100% correct (all questions answered correctly)
    const isPerfectScore = success && (currentQuestion + 1 === questions.length);
    setGameState(isPerfectScore ? 'perfect' : (success ? 'completed' : 'failed'));
    
    // Submit results to backend
    try {
      const response = await fetch('/api/quiz/end-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: parseInt(quizId),
          walletAddress: connectedAddress,
          questionsAnswered: currentQuestion + 1,
          correctAnswers: score,
          // pointsEarned is now calculated dynamically on the server
          failedAtQuestion: success ? null : currentQuestion + 1
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to submit quiz results:', data.error);
        // Check if it's an end goal exceeded error
        if (data.error && data.error.includes('exceed the end goal')) {
          alert('🏆 Congratulations! You\'re very close to the end goal. The competition will end when someone reaches the target points.');
        }
      } else {
        // Use dynamic points from backend
        if (typeof data.pointsEarned === 'number') {
          setEarnedPoints(data.pointsEarned);
        }
      }
    } catch (error) {
      console.error('Error submitting quiz results:', error);
    }
  };

  const tryAgain = () => {
    router.push('/quiz');
  };

  const playAgain = () => {
    window.location.reload();
  };

  const goToLeaderboard = () => {
    router.push('/leaderboard');
  };

  const goBackToQuizzes = () => {
    router.push('/quiz');
  };

  if (loading) {
    return (
      <div className="quiz-game-page">
        <Header />
        <main className="quiz-game-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quiz...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-game-page">
        <Header />
        <main className="quiz-game-main">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={goBackToQuizzes} className="back-button">
              Back to Quizzes
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (gameState === 'failed') {
    return (
      <div className="quiz-game-page">
        <Header />
        <main className="quiz-game-main">
          <div className="quiz-result failed">
            <div className="result-icon">❌</div>
            <h2>Quiz Failed!</h2>
            <p>You missed the last question. Try again!</p>
            <div className="result-stats">
              <p>Questions answered: {currentQuestion + 1}</p>
              <p>Correct answers: {score}</p>
              <p>Points earned: 0</p>
            </div>
            <div className="result-actions">
              <button onClick={tryAgain} className="try-again-button">
                Try Again
              </button>
              <button onClick={goToLeaderboard} className="leaderboard-button">
                View Leaderboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (gameState === 'perfect') {
    return (
      <div className="quiz-game-page">
        <Header />
        <main className="quiz-game-main">
          <div className="quiz-result perfect">
            <div className="result-icon">🎉</div>
            <h2>Perfect Score!</h2>
            <p>Congratulations! You got 100% correct and earned {earnedPoints.toLocaleString()} points!</p>
            <div className="result-stats">
              <p>Questions answered: {questions.length}</p>
              <p>Correct answers: {score}</p>
              <p>Points earned: {earnedPoints.toLocaleString()}</p>
            </div>
            <div className="result-actions">
              <button onClick={playAgain} className="play-again-button">
                Play Again
              </button>
              <button onClick={goToLeaderboard} className="leaderboard-button">
                View Leaderboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (gameState === 'completed') {
    return (
      <div className="quiz-game-page">
        <Header />
        <main className="quiz-game-main">
          <div className="quiz-result completed">
            <div className="result-icon">✅</div>
            <h2>Quiz Completed!</h2>
            <p>Good job! You earned {earnedPoints.toLocaleString()} points!</p>
            <div className="result-stats">
              <p>Questions answered: {questions.length}</p>
              <p>Correct answers: {score}</p>
              <p>Points earned: {earnedPoints.toLocaleString()}</p>
            </div>
            <div className="result-actions">
              <button onClick={tryAgain} className="try-again-button">
                Try Again
              </button>
              <button onClick={goToLeaderboard} className="leaderboard-button">
                View Leaderboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (gameState !== 'playing' || !questions[currentQuestion]) {
    return (
      <div className="quiz-game-page">
        <Header />
        <main className="quiz-game-main">
          <div className="loading-container">
            <p>Preparing quiz...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="quiz-game-page">
      <Header />
      
      <main className="quiz-game-main">
        <div className="quiz-game-header">
          <div className="quiz-info">
            <h1>{quizInfo?.title}</h1>
            <p>Question {currentQuestion + 1} of {questions.length}</p>
          </div>
          
          <div className="game-stats">
            <div className="timer">
              <span className="timer-label">Time:</span>
              <span className={`timer-value ${timeLeft <= 3 ? 'warning' : ''}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="score">
              <span className="score-label">Score:</span>
              <span className="score-value">{score}</span>
            </div>
          </div>
        </div>
        
        <div className="question-container">
          <div className="question">
            <h2>{currentQ.questionText}</h2>
          </div>
          
          <div className="answers">
            {currentQ.answers.map((answer, index) => (
              <button
                key={index}
                className="answer-button"
                onClick={() => handleAnswer(answer)}
                disabled={gameState !== 'playing'}
              >
                {answer}
              </button>
            ))}
          </div>
        </div>
        
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
