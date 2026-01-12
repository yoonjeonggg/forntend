import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client'; // SockJS 임포트
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

interface ChatDetail {
  chatRoomId: number;
  title: string;
  tag: string;
  author: string;
  studentNum: number;
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
  const [chatDetail, setChatDetail] = useState<ChatDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMsgLoading, setIsMsgLoading] = useState(false);

  const stompClient = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 하단 고정
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // WebSocket 연결 및 구독 설정
  useEffect(() => {
    if (selectedChatId) {
      connectWebSocket(selectedChatId);
    }
    return () => disconnectWebSocket();
  }, [selectedChatId]);

  const connectWebSocket = (roomId: number) => {
    console.log(`[WebSocket] SockJS 연결 시도 중... (Room ID: ${roomId})`);
    
    // 백엔드에 .withSockJS()가 설정되어 있으므로 webSocketFactory를 사용해야 합니다.
    stompClient.current = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws-chat'),
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      debug: (str) => {
        console.log('[STOMP Debug]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: (frame) => {
        console.log('[WebSocket] 연결 성공! 상태:', frame.headers['user-name'] || 'Connected');
        
        const subscriptionPath = `/sub/chat/room/${roomId}`;
        console.log(`[WebSocket] 구독 시작: ${subscriptionPath}`);
        
        stompClient.current?.subscribe(
          subscriptionPath, 
          (frame) => {
            try {
              const newMessage = JSON.parse(frame.body);
              console.log('[WebSocket] 새 메시지 수신:', newMessage);
              setMessages((prev) => [...prev, newMessage]);
            } catch (error) {
              console.error('[WebSocket] 메시지 파싱 에러:', error);
            }
          },
          {
            // 구독 시에도 토큰을 전송 (서버 인터셉터에서 권한 확인 시 필요)
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        );
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP 프로토콜 에러 발생');
        console.error('에러 메시지:', frame.headers['message']);
        console.error('상세 내용:', frame.body);
      },

      onWebSocketClose: (event) => {
        console.warn('[WebSocket] 연결 닫힘 (Close Event):', event);
      },

      onDisconnect: () => {
        console.log('[WebSocket] 연결 해제 완료 (Disconnected)');
      }
    });

    stompClient.current.activate();
  };

  const disconnectWebSocket = () => {
    if (stompClient.current) {
      console.log('[WebSocket] 수동 연결 해제 시도');
      stompClient.current.deactivate();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (!stompClient.current?.connected) {
      console.error('[Message] 전송 실패: WebSocket 미연결');
      alert('연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const request = {
      roomId: selectedChatId,
      message: inputValue.trim(),
    };

    try {
      stompClient.current.publish({
        destination: '/pub/chat/send',
        body: JSON.stringify(request),
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setInputValue('');
    } catch (err) {
      console.error('[Message] 전송 에러:', err);
    }
  };

  const fetchMyChats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/chats/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const result = await response.json();
      if (result.success) setChats(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatDetail = async (roomId: number) => {
    try {
      const response = await fetch(`http://localhost:8081/api/chats/me/${roomId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const result = await response.json();
      if (result.success) setChatDetail(result.data);
    } catch (err) {
      console.error('상세 조회 실패:', err);
    }
  };

  const fetchMessages = async (roomId: number) => {
    setIsMsgLoading(true);
    try {
      const response = await fetch(`http://localhost:8081/api/messages/${roomId}?size=100`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
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
    setChatDetail(null);
    fetchChatDetail(roomId);
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
            {isLoading ? (
              <p className="status-message">로딩 중...</p>
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
                <div className="header-top">
                  <h3 className="header-title">{chatDetail?.title}</h3>
                  {chatDetail && (
                    <span className={`chat-status-badge ${getTagInfo(chatDetail.tag).className}`}>
                      {getTagInfo(chatDetail.tag).text}
                    </span>
                  )}
                </div>
                {chatDetail && (
                  <div className="header-bottom">
                    <span className="author-info">
                      {chatDetail.author} - {chatDetail.studentNum}
                    </span>
                    <span className="date-info">
                      {new Date(chatDetail.createdAt).toLocaleDateString().replace(/\.$/, '')}
                    </span>
                  </div>
                )}
              </header>
              
              <div className="message-list" ref={scrollRef}>
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

              <div className="chat-input-wrapper">
                <form className="chat-input-container" onSubmit={handleSendMessage}>
                  <button type="button" className="plus-btn">+</button>
                  <input 
                    type="text" 
                    placeholder="메시지를 입력하세요." 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button type="submit" className="send-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
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