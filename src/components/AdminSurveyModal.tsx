import React, { useState } from 'react';
import './styles/surveyModel.css';

interface AdminSurveyProps {
  onCancel: () => void;
  // 부모 컴포넌트(MyChat)에서 처리할 수 있도록 tag 정보를 넘겨줍니다.
  onConfirm: (tag: 'ADOPT' | 'REJECT' | 'END') => void;
}

const AdminSurveyModel: React.FC<AdminSurveyProps> = ({ onCancel, onConfirm }) => {
  // 기본값을 '종료(END)'로 설정
  const [selectedTag, setSelectedTag] = useState<'ADOPT' | 'REJECT' | 'END'>('END');

  const tagLabels = [
    { label: '채택', value: 'ADOPT' },
    { label: '반려', value: 'REJECT' },
    { label: '종료', value: 'END' },
  ];

  return (
    <div className="survey-overlay" onClick={onCancel}>
      <div className="survey-modal" onClick={(e) => e.stopPropagation()}>
        <div className="survey-header">1:1 문의 관리자 처리</div>
        
        <div className="survey-question">
          문의 내용을 어떻게 처리하시겠습니까?
        </div>

        <div className="survey-options">
          {tagLabels.map((item) => (
            <label key={item.value} className="option-label">
              <input
                type="radio"
                name="chatStatus"
                value={item.value}
                checked={selectedTag === item.value}
                onChange={() => setSelectedTag(item.value as 'ADOPT' | 'REJECT' | 'END')}
              />
              <span className="option-text">{item.label}</span>
            </label>
          ))}
        </div>

        <div className="survey-buttons">
          <button type="button" className="btn-cancel" onClick={onCancel}>취소</button>
          <button 
            type="button" 
            className="btn-confirm" 
            onClick={() => onConfirm(selectedTag)}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSurveyModel;