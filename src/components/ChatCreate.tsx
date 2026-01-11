import { useState } from 'react';
import './styles/ChatCreate.css';

interface ChatCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated?: (chat: CreatedChat) => void;
}

interface CreatedChat {
  chatId: number;
  title: string;
  tag: string[];
  createdAt: string;
}

const ChatCreate = ({ isOpen, onClose, onChatCreated }: ChatCreateProps) => {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('채팅 제목을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8081/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('채팅 생성에 실패했습니다.');
      }

      const data: CreatedChat = await response.json();
      
      // 성공 시 콜백 호출
      if (onChatCreated) {
        onChatCreated(data);
      }

      // 모달 닫기 및 상태 초기화
      setTitle('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '채팅 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-create-overlay" onClick={handleCancel}>
      <div className="chat-create-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="chat-create-title">채팅 생성하기</h2>
        <p className="chat-create-subtitle">
          본의 또는 대화 주제를 입력해주세요.
        </p>

        <input
          type="text"
          className="chat-create-input"
          placeholder="채팅 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          autoFocus
        />

        {error && <p className="chat-create-error">{error}</p>}

        <div className="chat-create-buttons">
          <button
            className="chat-create-btn cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            취소
          </button>
          <button
            className="chat-create-btn submit"
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? '생성 중...' : '완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatCreate;