import React from 'react';

/**
 * Компонент для отображения списка вопросов теста
 * @param {Object} props - Свойства компонента
 * @param {Array} props.questions - Массив вопросов
 * @param {Array} props.answers - Массив ответов студента
 */
const QuestionsList = ({ questions, answers }) => {
  if (!questions || !answers) return null;
  
  return (
    <div className="questions-list">
      {questions.map((question, index) => {
        // Находим ответ студента для данного вопроса
        const answerObj = answers.find(a => 
          a.questionId === question._id.toString() || a.questionId === question._id
        );
        
        // Находим выбранный вариант среди опций вопроса
        const selectedOption = answerObj && question.options.find(o => 
          o._id.toString() === answerObj.optionId || o._id === answerObj.optionId
        );
        
        // Определяем, правильный ли ответ дал студент
        const isCorrect = selectedOption && selectedOption.isCorrect === true;
        
        return (
          <div key={question._id} className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="question-header">
              <div className="question-number">Сұрақ {index + 1}</div>
              <div className="question-points">{question.points} ұпай</div>
              <div className={`question-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? 'Дұрыс' : 'Қате'}
              </div>
            </div>
            
            <div className="question-text">{question.text}</div>
            
            <div className="question-options">
              {question.options.map(option => {
                // Проверяем, выбран ли этот вариант студентом
                const isSelected = answerObj && (
                  answerObj.optionId === option._id.toString() || 
                  answerObj.optionId === option._id
                );
                
                // Определяем, является ли вариант правильным
                const isCorrectOption = option.isCorrect === true;
                
                // Определяем CSS класс для варианта
                let optionClass = '';
                if (isSelected && isCorrectOption) {
                  optionClass = 'correct-selected';
                } else if (isSelected && !isCorrectOption) {
                  optionClass = 'incorrect-selected';
                } else if (isCorrectOption) {
                  optionClass = 'correct-option';
                } else {
                  optionClass = 'regular-option';
                }
                
                return (
                  <div 
                    key={option._id} 
                    className={`option-result ${optionClass} ${isSelected ? 'selected' : ''}`}
                  >
                    <span className="option-text">{option.text}</span>
                    {isSelected && (
                      <span className="option-indicator">
                        {isCorrectOption ? '✓' : '✗'}
                      </span>
                    )}
                    {!isSelected && isCorrectOption && (
                      <span className="option-correct-hint">
                        (правильный ответ)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestionsList; 