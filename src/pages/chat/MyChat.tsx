import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Header } from '../../components';
import ChatCreate from '../../components/ChatCreate';
import ChatClose from '../../components/ChatClose'; 
import { useAuth } from '../../contexts/AuthContext';
import './styles/MyChat.css';
// 1. SurveyModel로 임포트 파일명 수정
import SurveyModel from '../../components/SurveyModel';

// 2. 파일 내부에 정의되어 있던 중복 SurveyModal 컴포넌트 삭제 (요청하신 부분)

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
  const { userId: myUserId } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatCloseModalOpen, setIsChatCloseModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

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
    stompClient.current = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws-chat'),
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      onConnect: () => {
        stompClient.current?.subscribe(
          `/sub/chat/room/${roomId}`,
          (frame) => {
            try {
              const newMessage = JSON.parse(frame.body);
              setMessages((prev) => [...prev, newMessage]);
            } catch (error) {
              console.error('[WebSocket] 메시지 파싱 에러:', error);
            }
          },
          { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        );
      },
    });
    stompClient.current.activate();
  };

  const disconnectWebSocket = () => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !stompClient.current?.connected) return;

    const request = {
      roomId: selectedChatId,
      message: inputValue.trim(),
    };

    stompClient.current.publish({
      destination: '/pub/chat/send',
      body: JSON.stringify(request),
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    });
    setInputValue('');
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

  // 종료 버튼 클릭 핸들러
  const handleExitClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); 
    }

    if (!chatDetail) {
      console.error("채팅 상세 정보가 로드되지 않았습니다.");
      return;
    }

    if (chatDetail.tag === 'IN_PROGRESS') {
      setIsChatCloseModalOpen(true);
    } else {
      setIsSurveyModalOpen(true);
    }
  };

  // 채팅 설정 API (SurveyModel 확인 클릭 시)
  const handleSurveyConfirm = async (option: { isPublic: boolean; isAnonymous: boolean }) => {
    if (!selectedChatId) return;
    try {
      const response = await fetch('http://localhost:8081/api/chats/setting', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          chatRoomId: selectedChatId,
          isAnonymous: option.isAnonymous,
          isPublic: option.isPublic,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('설정이 저장되었습니다.');
        setIsSurveyModalOpen(false);
        fetchChatDetail(selectedChatId);
      }
    } catch (err) {
      console.error('설정 저장 에러:', err);
    }
  };

  const getTagInfo = (tag: string) => {
    switch (tag) {
      case 'ADOPT': return { text: '채택됨', className: 'status-adopted' };
      case 'END': return { text: '종료됨', className: 'status-end' };
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
                <div className="header-left">
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
                        {new Date(chatDetail.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="header-right">
                  <button className="chat-exit-btn" onClick={handleExitClick}>
                    종료
                  </button>
                </div>
              </header>
              
             <div className="message-list" ref={scrollRef}>
  {isMsgLoading ? (
    <p className="msg-status">메시지를 불러오는 중...</p>
  ) : messages.length > 0 ? (
    messages.map((msg, idx) => {
      // 1. 내 메시지인지 확인 (현재 로그인한 유저 ID와 메시지 발신자 ID 비교)
      const isMine = msg.sender === myUserId;

      return (
        <div 
          key={idx} 
          className={`message-wrapper ${isMine ? 'mine' : 'others'} ${msg.deleted ? 'deleted' : ''}`}
        >
          <div className="msg-bubble">
            {/* 2. 내가 아닐 때만 상대방 이름 표시 */}
            {!isMine && <span className="sender-name">{msg.senderName}</span>}
            
            <p className="msg-text">
              {msg.deleted ? '삭제된 메시지입니다.' : msg.message}
            </p>
            
            <span className="msg-date">
              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>
      );
    })
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
        </main>
      </div>

      {/* 모달 관리 */}
      <ChatCreate 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onChatCreated={() => fetchMyChats()}
      />

      <ChatClose 
        isOpen={isChatCloseModalOpen}
        onClose={() => setIsChatCloseModalOpen(false)}
        chatRoomId={selectedChatId}
        onSuccess={() => {
          setIsChatCloseModalOpen(false);
          fetchChatDetail(selectedChatId!); 
          setIsSurveyModalOpen(true); 
        }}
      />

      {isSurveyModalOpen && (
        // 3. 임포트한 SurveyModel 컴포넌트 사용
        <SurveyModel 
          onCancel={() => setIsSurveyModalOpen(false)}
          onConfirm={handleSurveyConfirm}
        />
      )}
    </div>
  );
};

export default MyChat;