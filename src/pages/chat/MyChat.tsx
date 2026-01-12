import React, { useState, useEffect } from 'react';
import { Header } from '../../components';
import ChatCreate from '../../components/ChatCreate';
import './styles/MyChat.css';

interface ChatRoom {
  chatRoomId: number;
  title: string;
  tag: string;
  author: string;
  createdAt: string;
}

interface Message {
  message: string;
  sender: number;
  senderName: string;
  createdAt: string;
  deleted: boolean;
}

const MyChat = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // ESLint 에러 해결: isLoading 사용
  const [isLoading, setIsLoading] = useState(true);
  const [isMsgLoading, setIsMsgLoading] = useState(false);

  const fetchMyChats = async () => {
    setIsLoading(true); // 로딩 시작
    try {
      const response = await fetch('http://localhost:8081/api/chats/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const result = await response.json();
      if (result.success) setChats(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  const fetchMessages = async (roomId: number) => {
    setIsMsgLoading(true);
    try {
      const response = await fetch(`http://localhost:8081/api/messages/${roomId}?size=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const result = await response.json();
      if (result.success) setMessages(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMsgLoading(false);
    }
  };

  useEffect(() => {
    fetchMyChats();
  }, []);

  const handleChatClick = (roomId: number) => {
    setSelectedChatId(roomId);
    fetchMessages(roomId);
  };

  const getTagInfo = (tag: string) => {
    switch (tag) {
      case 'ADOPT': return { text: '채택됨', className: 'status-adopted' };
      default: return { text: '진행 중', className: 'status-ing' };
    }
  };

  return (
    <div className="mychat-page">
      <Header />
      <div className="mychat-container">
        <aside className="mychat-sidebar">
          <div className="new-chat-btn" onClick={() => setIsModalOpen(true)}>
            <span className="edit-icon">✎</span> 새 채팅
          </div>
          <div className="chat-list-section">
            <h3 className="list-title">💬 내 채팅</h3>
            
            {/* isLoading 사용: 채팅 목록 로딩 처리 */}
            {isLoading ? (
              <p className="status-message">채팅 목록을 불러오는 중...</p>
            ) : (
              <ul className="chat-list">
                {chats.map((chat) => (
                  <li 
                    key={chat.chatRoomId} 
                    className={`chat-item ${selectedChatId === chat.chatRoomId ? 'active' : ''}`}
                    onClick={() => handleChatClick(chat.chatRoomId)}
                  >
                    <div className="chat-info">
                      <span className="chat-item-title">{chat.title}</span>
                    </div>
                    <span className={`chat-status-badge ${getTagInfo(chat.tag).className}`}>
                      {getTagInfo(chat.tag).text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="mychat-content">
          {selectedChatId ? (
            <div className="chat-window">
              <header className="chat-header">
                <h3>{chats.find(c => c.chatRoomId === selectedChatId)?.title}</h3>
              </header>
              
              <div className="message-list">
                {isMsgLoading ? (
                  <p className="msg-status">메시지를 불러오는 중...</p>
                ) : messages.length > 0 ? (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`message-item ${msg.deleted ? 'deleted' : ''}`}>
                      <div className="msg-bubble">
                        <span className="sender-name">{msg.senderName}</span>
                        <p className="msg-text">{msg.deleted ? '삭제된 메시지입니다.' : msg.message}</p>
                        <span className="msg-date">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="msg-status">대화 내용이 없습니다.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h2>대화 내용을 확인하세요</h2>
              <p>왼쪽 목록에서 채팅방을 선택해 주세요.</p>
            </div>
          )}

          <ChatCreate 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onChatCreated={() => fetchMyChats()}
          />
        </main>
      </div>
    </div>
  );
};

export default MyChat;