// components/ProfileQuestions/ProfileQuestions.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../../config/axiosConfig';
import './ProfileQuestions.css';

const ProfileQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axiosInstance.get('/questions/seller');
      // Sadece yanıtlanmamış soruları filtrele
      const unansweredQuestions = response.data.filter(q => !q.answer);
      setQuestions(unansweredQuestions);
    } catch (error) {
      console.error('Sorular yüklenirken hata:', error);
    }
  };

  const handleAnswer = async (questionId) => {
    try {
      await axiosInstance.post(`/questions/${questionId}/answer`, {
        answer: answer
      });
      
      // Yanıtlanan soruyu listeden kaldır
      setQuestions(questions.filter(q => q._id !== questionId));
      setSelectedQuestion(null);
      setAnswer('');
    } catch (error) {
      console.error('Yanıt gönderilirken hata:', error);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="no-questions">
        <h2>Yanıtlanmamış Soru Yok</h2>
        <p>Şu anda yanıtlamanız gereken soru bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="profile-questions">
      <h2>Yanıtlanmayı Bekleyen Sorular ({questions.length})</h2>
      <div className="questions-list">
        {questions.map((question) => (
          <div key={question._id} className="question-card">
          <div className="question-product">
            <img 
              src={question.productId?.images?.[0] || question.productId?.image || '/default-product.jpg'} 
              alt={question.productId?.name || 'Ürün'}
              className="product-thumbnail" 
            />
            <div className="product-info">
              <span className="product-name">{question.productId?.name || 'Ürün adı'}</span>
              <span className="question-date">
                {new Date(question.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>
            
            <div className="question-content">
              <div className="asker-info">
                <span className="asker-name">{question.askerId.username}</span> soruyor:
              </div>
              
              <p className="question-text">{question.question}</p>
              
              <div className="answer-form">
                {selectedQuestion?._id === question._id ? (
                  <>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Yanıtınızı yazın..."
                      rows="3"
                    />
                    <div className="answer-actions">
                      <button 
                        className="submit-answer"
                        onClick={() => handleAnswer(question._id)}
                        disabled={!answer.trim()}
                      >
                        Yanıtı Gönder
                      </button>
                      <button 
                        className="cancel-answer"
                        onClick={() => {
                          setSelectedQuestion(null);
                          setAnswer('');
                        }}
                      >
                        İptal
                      </button>
                    </div>
                  </>
                ) : (
                  <button 
                    className="answer-button"
                    onClick={() => setSelectedQuestion(question)}
                  >
                    Yanıtla
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileQuestions;