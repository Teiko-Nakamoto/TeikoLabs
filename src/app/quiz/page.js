'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/header';
import Footer from '../components/footer';
import './quiz.css';

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [competitionActive, setCompetitionActive] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get connected wallet address
    const address = localStorage.getItem('connectedAddress');
    setConnectedAddress(address || '');

    // Load available quizzes
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quizzes/list');
      const data = await response.json();
      
      if (data.success) {
        setQuizzes(data.quizzes);
      } else {
        setError(data.error || 'Failed to load quizzes');
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quizId) => {
    if (!connectedAddress) {
      alert('Please connect your wallet to play quizzes!');
      return;
    }
    
    router.push(`/quiz/${quizId}/play`);
  };

  const viewLeaderboard = () => {
    router.push('/leaderboard');
  };

  if (loading) {
    return (
      <div className="quiz-page">
        <Header />
        <main className="quiz-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quizzes...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-page">
        <Header />
        <main className="quiz-main">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={loadQuizzes} className="retry-button">
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <Header />
      
      <main className="quiz-main">
        <div className="quiz-header">
          <h1>🎯 Quiz Competition</h1>
          <p>Test your knowledge and earn revenue! First person to reach 21 million total points ends the competition.</p>
          
          {!connectedAddress && (
            <div className="wallet-warning">
              <p>⚠️ Please connect your wallet to participate in quizzes</p>
            </div>
          )}
        </div>

        <div className="quiz-actions">
          <button onClick={viewLeaderboard} className="leaderboard-button">
            🏆 View Leaderboard
          </button>
        </div>

        <div className="quizzes-container">
          <h2>Available Quizzes</h2>
          
          {quizzes.length === 0 ? (
            <div className="no-quizzes">
              <p>No quizzes available at the moment.</p>
            </div>
          ) : (
            <div className="quiz-grid">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="quiz-card">
                  <div className="quiz-card-header">
                    <h3>{quiz.title}</h3>
                    <div className="quiz-stats">
                      <span className="stat">
                        <span className="stat-label">Questions:</span>
                        <span className="stat-value">{quiz.max_questions}</span>
                      </span>
                      <span className="stat">
                        <span className="stat-label">Time:</span>
                        <span className="stat-value">{quiz.time_per_question}s</span>
                      </span>
                      <span className="stat">
                        <span className="stat-label">Revenue:</span>
                        <span className="stat-value">Dynamic</span>
                      </span>
                    </div>
                  </div>
                  
                  {quiz.description && (
                    <p className="quiz-description">{quiz.description}</p>
                  )}
                  
                  <button 
                    onClick={() => startQuiz(quiz.id)}
                    className="start-quiz-button"
                    disabled={!connectedAddress}
                  >
                    {connectedAddress ? 'Start Quiz' : 'Connect Wallet to Play'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quiz-rules">
          <h3>📋 Quiz Rules</h3>
          <ul>
            <li>Each question has a 10-second time limit</li>
            <li>Maximum 6 questions per quiz</li>
            <li>One wrong answer ends the quiz immediately</li>
            <li>Perfect score (all 6 questions) earns dynamic revenue</li>
            <li>Competition ends when total points reach 21 million</li>
            <li>No hints or explanations for wrong answers</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
