import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/header';
import Tag from '../../components/Tag';
import { fetchChatDetail } from '../../services/chat';
import type { ChatDetailResponse, ChatMessage } from '../../types/chat/ChatDetail';
import './ChatDetail.css';
import { patchChatReaction } from '../../services/chat';

export default function ChatDetail() {
  const navigate = useNavigate();
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const [chatDetail, setChatDetail] = useState<ChatDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }

    if (!chatRoomId) {
      setError('채팅방 ID가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchChatDetail(Number(chatRoomId))
      .then(setChatDetail)
      .catch((err: any) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [chatRoomId, navigate]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours % 12 || 12;
    return `${period} ${displayHours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="chat-detail-container">
          <div className="loading">불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !chatDetail) {
    return (
      <div>
        <Header />
        <div className="chat-detail-container">
          <div className="error">{error || '채팅방을 불러올 수 없습니다.'}</div>
        </div>
      </div>
    );
  }

  // sender가 0이면 관리자, 그 외는 사용자로 간주
  const isAdmin = (sender: number) => sender === 0;

  const handleReaction = async (type: 'LIKE' | 'DISLIKE') => {
    if (!chatRoomId) return;
  
    try {
      const result = await patchChatReaction(Number(chatRoomId), type);

      setChatDetail(prev =>
        prev
          ? {
              ...prev,
              likeCnt: result.likeCnt,
              dislikeCnt: result.dislikeCnt,
              myReaction:
                prev.myReaction === type ? null : type,
            }
          : prev
      );

    } catch (e: any) {
      alert(e.message);
    }
  };
  
  return (
    <div>
      <Header />
      <div className="chat-detail-container">
        <div className="chat-header">
          <div className="chat-title-section">
            <h1 className="chat-title">{chatDetail.title}</h1>
            <div className="chat-tags">
              <Tag tag={chatDetail.tag} />
            </div>
            <div className="chat-meta">
              <span className="chat-author">
                {chatDetail.items.length > 0 
                  ? `${chatDetail.items[0].senderName} - ${chatDetail.items[0].sender}`
                  : '작성자 정보 없음'}
              </span>
              <span className="chat-date">{formatDate(chatDetail.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {chatDetail.items.map((item: ChatMessage, index: number) => {
            const admin = isAdmin(item.sender);
            return (
              <div key={index} className={`message-wrapper ${admin ? 'admin' : 'user'}`}>
                <div className="message-label">{admin ? '관리자' : '사용자'}</div>
                <div className={`message-bubble ${admin ? 'admin-bubble' : 'user-bubble'}`}>
                  {item.isDeleted ? (
                    <span className="deleted-message">삭제된 메시지입니다.</span>
                  ) : (
                    <span>{item.message}</span>
                  )}
                </div>
                <div className="message-time">{formatDateTime(item.createdAt)}</div>
              </div>
            );
          })}
        </div>
        <div className="chat-actions">
        <button
          className={`action-button like-button ${
            chatDetail.myReaction === 'LIKE' ? 'active' : ''
          }`}
          onClick={() => handleReaction('LIKE')}
        >
            <span className="action-label">공감해요</span>
            <span className="action-count">{chatDetail.likeCnt}</span>
          </button>

          <button
            className={`action-button dislike-button ${
              chatDetail.myReaction === 'DISLIKE' ? 'active' : ''
            }`}
            onClick={() => handleReaction('DISLIKE')}
          >
            <span className="action-label">별로예요</span>
            <span className="action-count">{chatDetail.dislikeCnt}</span>
          </button>
        </div>
      </div>
    </div>
  );
}