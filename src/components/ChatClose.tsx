import React from 'react';
import './styles/ChatClose.css';

interface ChatCloseProps {
  isOpen: boolean;
  onClose: () => void;
  chatRoomId: number | null;
  onSuccess?: () => void; // 종료 성공 후 새로고침 등을 위한 콜백
}

const ChatClose: React.FC<ChatCloseProps> = ({ isOpen, onClose, chatRoomId, onSuccess }) => {
  if (!isOpen) return null;

  const handleConfirmClose = async () => {
    if (!chatRoomId) return;

    try {
      const response = await fetch('http://localhost:8081/api/chats/close', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          chatRoomId: chatRoomId,
          tag: "END" // 기본 종료 태그. 상황에 따라 ADOPT, REJECT로 변경 가능하도록 확장 가능
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('채팅이 성공적으로 종료되었습니다.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert('채팅 종료에 실패했습니다.');
      }
    } catch (error) {
      console.error('채팅 종료 API 에러:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chat-close-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">1:1 문의 채팅 종료</div>
        <div className="modal-body">
          <h2>종료하시겠습니까?</h2>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button className="btn-confirm" onClick={handleConfirmClose}>종료</button>
        </div>
      </div>
    </div>
  );
};

export default ChatClose;