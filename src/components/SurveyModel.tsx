// SurveyModal.tsx
import React, { useState } from 'react';
import './styles/surveyModel.css';

const SurveyModal: React.FC<{
  onCancel: () => void;
  onConfirm: (option: { isPublic: boolean; isAnonymous: boolean }) => void;
}> = ({ onCancel, onConfirm }) => {
  const [selectedOption, setSelectedOption] = useState<string>('익명');

  const handleConfirm = () => {
    // 선택된 텍스트 값에 따라 백엔드에 보낼 boolean 값 매핑
    const payload = {
      isPublic: selectedOption !== '비공개',
      isAnonymous: selectedOption === '익명',
    };
    onConfirm(payload);
  };

  return (
    <div className="survey-overlay" onClick={onCancel}>
      <div className="survey-modal" onClick={(e) => e.stopPropagation()}>
        <div className="survey-header">1:1 문의 채팅 종료</div>
        
       

        <div className="survey-question">
          게시판에 등록하시겠습니까?
        </div>

        <div className="survey-options">
          {['비공개', '익명', '실명'].map((opt) => (
            <label key={opt} className="option-label">
              <input
                type="radio"
                name="publish"
                value={opt}
                checked={selectedOption === opt}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              <span className="option-text">{opt}</span>
            </label>
          ))}
        </div>

        <div className="survey-buttons">
          <button type="button" className="btn-cancel" onClick={onCancel}>취소</button>
          <button type="button" className="btn-confirm" onClick={handleConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default SurveyModal;