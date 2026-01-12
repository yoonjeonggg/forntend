import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Header } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import AdminSurveyModel from '../../components/AdminSurveyModal';
import './styles/AdminChat.css';

interface Message {
  message: string;
  sender: number;
  senderName: string;
  createdAt: string;
  deleted: boolean;
}

interface ChatDetail {
  chatRoomId: number;
  title: string;
  tag: string;
  author: string;
  studentNum: number;
  createdAt: string;
}

const AdminChat = () => {
  const { userId: myUserId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isMsgLoading, setIsMsgLoading] = useState(false);
  const [chatDetail, setChatDetail] = useState<ChatDetail | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  
  // 실제 환경에선 URL 파라미터(useParams) 등에서 추출하세요.
  const selectedChatId = 5; 

  const stompClient = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 하단 고정
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // WebSocket 연결
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
              console.error('[WebSocket] 파싱 에러:', error);
            }
          },
          { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        );
      },
    });
    stompClient.current.activate();
  };

  const disconnectWebSocket = () => {
    stompClient.current?.deactivate();
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

  // 상세 조회 (헤더 정보용)
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

  // 초기 메시지 내역 불러오기
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
    if (selectedChatId) {
      fetchChatDetail(selectedChatId);
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  // 종료 버튼 클릭 시 모달 열기
  const handleExitClick = () => {
    setIsSurveyModalOpen(true);
  };

  // SurveyModel에서 최종 tag 선택 시 호출되는 종료 API
  const handleSurveyConfirm = async (tag: 'ADOPT' | 'REJECT' | 'END') => {
    try {
      const response = await fetch('http://localhost:8081/api/chats/close', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          chatRoomId: selectedChatId,
          tag: tag
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('채팅이 성공적으로 종료되었습니다.');
        setIsSurveyModalOpen(false);
        fetchChatDetail(selectedChatId); // 상태 갱신
      }
    } catch (err) {
      console.error('종료 처리 에러:', err);
    }
  };

  const getTagInfo = (tag: string) => {
    switch (tag) {
      case 'ADOPT': return { text: '채택됨', className: 'status-adopted' };
      case 'REJECT': return { text: '반려됨', className: 'status-rejected' };
      case 'END': return { text: '종료됨', className: 'status-end' };
      default: return { text: '진행 중', className: 'status-ing' };
    }
  };

  return (
    <div className="admin-chat-page">
      <Header />
      <div className="admin-chat-container">
        <main className="admin-chat-content">
          <div className="admin-chat-window">
            {/* MyChat과 동일한 구조의 헤더 */}
            <header className="chat-header">
              <div className="header-left">
                <div className="header-top">
                  <h3 className="header-title">{chatDetail?.title || '로딩 중...'}</h3>
                  {chatDetail && (
                    <span className={`chat-status-badge ${getTagInfo(chatDetail.tag).className}`}>
                      {getTagInfo(chatDetail.tag).text}
                    </span>
                  )}
                  <span className="admin-badge">ADMIN MODE</span>
                </div>
                {chatDetail && (
                  <div className="header-bottom">
                    <span className="author-info">
                      작성자: {chatDetail.author} ({chatDetail.studentNum})
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

            <div className="admin-message-list" ref={scrollRef}>
              {isMsgLoading ? (
                <p className="admin-msg-status">메시지를 불러오는 중...</p>
              ) : messages.length > 0 ? (
                messages.map((msg, idx) => {
                  const isMine = msg.sender === myUserId;
                  return (
                    <div 
                      key={idx} 
                      className={`admin-message-wrapper ${isMine ? 'mine' : 'others'}`}
                    >
                      <div className="admin-msg-bubble">
                        {!isMine && <span className="admin-sender-name">{msg.senderName}</span>}
                        <p className="admin-msg-text">
                          {msg.deleted ? '삭제된 메시지입니다.' : msg.message}
                        </p>
                        <span className="admin-msg-date">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="admin-msg-status">대화 내용이 없습니다.</p>
              )}
            </div>

            <div className="admin-chat-input-wrapper">
              <form className="admin-chat-input-container" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  placeholder="관리자 메시지를 입력하세요..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button type="submit" className="admin-send-btn">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* SurveyModel 모달 추가 */}
      {isSurveyModalOpen && (
        <AdminSurveyModel 
          onCancel={() => setIsSurveyModalOpen(false)}
          onConfirm={handleSurveyConfirm}
        />
      )}
    </div>
  );
};

export default AdminChat;