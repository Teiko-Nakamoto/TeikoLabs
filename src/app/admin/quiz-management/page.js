'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import './quiz-management.css';

export default function QuizManagement() {
  const [connectedAddress, setConnectedAddress] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quiz creation form
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    maxQuestions: 6,
    timePerQuestion: 10
  });
  
  // Question form
  const [questionForm, setQuestionForm] = useState({
    quizId: '',
    questionText: '',
    correctAnswer: '',
    wrongAnswer1: '',
    wrongAnswer2: '',
    wrongAnswer3: ''
  });
  
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizStatus, setQuizStatus] = useState('active'); // active, paused, completed

  useEffect(() => {
    const address = localStorage.getItem('connectedAddress');
    setConnectedAddress(address || '');
    
    if (address) {
      loadQuizzes();
      loadQuizStatus();
    }
  }, []);

  const loadQuizStatus = async () => {
    try {
      const response = await fetch('/api/quiz/status');
      const data = await response.json();
      
      if (data.success) {
        setQuizStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading quiz status:', error);
    }
  };

  const resetQuizCompetition = async () => {
    if (!confirm('Are you sure you want to reset the quiz competition? This will clear all user points and restart the competition.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/quiz/reset-competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Quiz competition reset successfully!');
        setQuizStatus('active');
      } else {
        alert('Error resetting quiz competition: ' + data.error);
      }
    } catch (error) {
      console.error('Error resetting quiz competition:', error);
      alert('Failed to reset quiz competition');
    }
  };

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

  const createQuiz = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/quizzes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Quiz created successfully!');
        setQuizForm({
          title: '',
          description: '',
          maxQuestions: 6,
          timePerQuestion: 10
        });
        setShowQuizForm(false);
        loadQuizzes();
      } else {
        alert('Error creating quiz: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz');
    }
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/quizzes/add-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Question added successfully!');
        setQuestionForm({
          quizId: questionForm.quizId,
          questionText: '',
          correctAnswer: '',
          wrongAnswer1: '',
          wrongAnswer2: '',
          wrongAnswer3: ''
        });
        loadQuizQuestions(questionForm.quizId);
      } else {
        alert('Error adding question: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question');
    }
  };

  const loadQuizQuestions = async (quizId) => {
    try {
      const response = await fetch(`/api/quiz/questions/${quizId}/manage`);
      const data = await response.json();
      
      if (data.success) {
        setQuizQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error loading quiz questions:', error);
    }
  };

  const selectQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setQuestionForm(prev => ({ ...prev, quizId: quiz.id }));
    loadQuizQuestions(quiz.id);
  };

  // Check if user is admin
  const isAdmin = connectedAddress === 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4' || 
                 connectedAddress === 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B';

  if (!isAdmin) {
    return (
      <div className="quiz-management-page">
        <Header />
        <main className="quiz-management-main">
          <div className="access-denied">
            <h2>🔒 Access Denied</h2>
            <p>You need admin privileges to access quiz management.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quiz-management-page">
        <Header />
        <main className="quiz-management-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quiz management...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="quiz-management-page">
      <Header />
      
      <main className="quiz-management-main">
        <div className="management-header">
          <h1>🎯 Quiz Management</h1>
          <p>Create and manage quizzes for the competition</p>
        </div>

        <div className="management-actions">
          <button 
            onClick={() => setShowQuizForm(true)} 
            className="create-quiz-button"
          >
            ➕ Create New Quiz
          </button>
          
          <button 
            onClick={resetQuizCompetition} 
            className="reset-competition-button"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              marginLeft: '1rem'
            }}
          >
            🔄 Reset Competition
          </button>
        </div>

        {/* Quiz Status Display */}
        <div className="quiz-status-display" style={{
          background: quizStatus === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${quizStatus === 'active' ? '#22c55e' : '#ef4444'}`,
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            color: quizStatus === 'active' ? '#22c55e' : '#ef4444',
            margin: '0 0 0.5rem 0'
          }}>
            {quizStatus === 'active' ? '🟢 Quiz Competition Active' : '🔴 Quiz Competition Paused'}
          </h3>
          <p style={{ margin: 0, color: '#9ca3af' }}>
            {quizStatus === 'active' 
              ? 'Users can play quizzes and earn points toward the 21 million goal.'
              : 'Quiz competition is paused. Reset to allow users to play again.'
            }
          </p>
        </div>

        {/* Quiz Creation Form */}
        {showQuizForm && (
          <div className="form-modal">
            <div className="form-content">
              <div className="form-header">
                <h2>Create New Quiz</h2>
                <button 
                  onClick={() => setShowQuizForm(false)}
                  className="close-button"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={createQuiz} className="quiz-form">
                <div className="form-group">
                  <label>Quiz Title *</label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                    required
                    placeholder="Enter quiz title"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                    placeholder="Enter quiz description"
                    rows="3"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Max Questions</label>
                    <input
                      type="number"
                      value={quizForm.maxQuestions}
                      onChange={(e) => setQuizForm({...quizForm, maxQuestions: parseInt(e.target.value)})}
                      min="1"
                      max="10"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Time per Question (seconds)</label>
                    <input
                      type="number"
                      value={quizForm.timePerQuestion}
                      onChange={(e) => setQuizForm({...quizForm, timePerQuestion: parseInt(e.target.value)})}
                      min="5"
                      max="60"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    Create Quiz
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowQuizForm(false)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Question Addition Form */}
        {showQuestionForm && selectedQuiz && (
          <div className="form-modal">
            <div className="form-content">
              <div className="form-header">
                <h2>Add Question to: {selectedQuiz.title}</h2>
                <button 
                  onClick={() => setShowQuestionForm(false)}
                  className="close-button"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={addQuestion} className="question-form">
                <div className="form-group">
                  <label>Question Text *</label>
                  <textarea
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({...questionForm, questionText: e.target.value})}
                    required
                    placeholder="Enter the question"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <input
                    type="text"
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({...questionForm, correctAnswer: e.target.value})}
                    required
                    placeholder="Enter correct answer"
                  />
                </div>
                
                <div className="form-group">
                  <label>Wrong Answer 1 *</label>
                  <input
                    type="text"
                    value={questionForm.wrongAnswer1}
                    onChange={(e) => setQuestionForm({...questionForm, wrongAnswer1: e.target.value})}
                    required
                    placeholder="Enter wrong answer 1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Wrong Answer 2 *</label>
                  <input
                    type="text"
                    value={questionForm.wrongAnswer2}
                    onChange={(e) => setQuestionForm({...questionForm, wrongAnswer2: e.target.value})}
                    required
                    placeholder="Enter wrong answer 2"
                  />
                </div>
                
                <div className="form-group">
                  <label>Wrong Answer 3 *</label>
                  <input
                    type="text"
                    value={questionForm.wrongAnswer3}
                    onChange={(e) => setQuestionForm({...questionForm, wrongAnswer3: e.target.value})}
                    required
                    placeholder="Enter wrong answer 3"
                  />
                </div>
                

                
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    Add Question
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowQuestionForm(false)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quizzes List */}
        <div className="quizzes-section">
          <h2>Existing Quizzes</h2>
          
          {quizzes.length === 0 ? (
            <div className="no-quizzes">
              <p>No quizzes created yet. Create your first quiz!</p>
            </div>
          ) : (
            <div className="quizzes-grid">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="quiz-card">
                  <div className="quiz-header">
                    <h3>{quiz.title}</h3>
                    <span className={`status ${quiz.is_active ? 'active' : 'inactive'}`}>
                      {quiz.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {quiz.description && (
                    <p className="quiz-description">{quiz.description}</p>
                  )}
                  
                  <div className="quiz-stats">
                    <span>Questions: {quiz.max_questions}</span>
                    <span>Time: {quiz.time_per_question}s</span>
                    <span>Points: {quiz.points_per_correct_answer * quiz.max_questions}</span>
                  </div>
                  
                  <div className="quiz-actions">
                    <button 
                      onClick={() => selectQuiz(quiz)}
                      className="manage-button"
                    >
                      Manage Questions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Quiz Questions */}
        {selectedQuiz && (
          <div className="questions-section">
            <div className="section-header">
              <h2>Questions for: {selectedQuiz.title}</h2>
              <button 
                onClick={() => setShowQuestionForm(true)}
                className="add-question-button"
              >
                ➕ Add Question
              </button>
            </div>
            
            {quizQuestions.length === 0 ? (
              <div className="no-questions">
                <p>No questions added yet. Add your first question!</p>
              </div>
            ) : (
              <div className="questions-list">
                {quizQuestions.map((question, index) => (
                  <div key={index} className="question-item">
                    <div className="question-header">
                      <span className="question-number">Q{index + 1}</span>
                      <span className="question-text">{question.questionText}</span>
                    </div>
                    <div className="answers-list">
                      <div className="answer correct">
                        <span className="answer-label">✓</span>
                        {question.correctAnswer}
                      </div>
                      {question.answers.filter(a => a !== question.correctAnswer).map((answer, i) => (
                        <div key={i} className="answer wrong">
                          <span className="answer-label">✗</span>
                          {answer}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
