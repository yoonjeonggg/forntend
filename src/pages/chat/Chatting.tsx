import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Client, type IMessage, type IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Header from '../../components/header';
import './styles/Chatting.css';

interface ChatMessage {
  message: string;
  sender: number;
  senderName: string;
  createdAt: string;
  deleted: boolean;
}

interface MessageResponse {
  data: ChatMessage[];
  message: string;
  success: boolean;
}

interface ChatRoomInfo {
  chatRoomId: number;
  title: string;
  tag: string;
  author: string;
  createdAt: string;
}

interface ChattingProps {
  chatRoomId?: number;
  embedded?: boolean;
}

const Chatting = ({ chatRoomId: propChatRoomId, embedded = false }: ChattingProps) => {
  const { chatRoomId: paramChatRoomId } = useParams<{ chatRoomId: string }>();
  const chatRoomId = propChatRoomId || (paramChatRoomId ? Number(paramChatRoomId) : null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [chatRoomInfo, setChatRoomInfo] = useState<ChatRoomInfo | null>(null);
  
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 채팅방 정보 및 메시지 불러오기
  useEffect(() => {
    fetchChatRoomInfo();
    fetchMessages();
    fetchCurrentUser();
  }, [chatRoomId]);

  // WebSocket 연결
  useEffect(() => {
    if (!chatRoomId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('로그인이 필요합니다.');
      return;
    }

    connectWebSocket(token);

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [chatRoomId]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('액세스 토큰이 없습니다.');
        return;
      }

      const response = await fetch('http://localhost:8081/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.userId || data.id);
        console.log('현재 사용자 ID:', data.userId || data.id);
      } else if (response.status === 500) {
        console.error('서버 오류: 사용자 정보를 가져올 수 없습니다.');
      } else if (response.status === 401 || response.status === 403) {
        console.error('인증 실패: 토큰이 유효하지 않습니다.');
        // 필요시 로그인 페이지로 리다이렉트
        // window.location.href = '/login';
      }
    } catch (err) {
      console.error('사용자 정보 로드 실패:', err);
    }
  };

  const fetchChatRoomInfo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('액세스 토큰이 없습니다.');
        return;
      }

      const response = await fetch(`http://localhost:8081/api/chats/${chatRoomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatRoomInfo(data.data);
        console.log('채팅방 정보:', data.data);
      } else if (response.status === 403) {
        console.warn('채팅방 정보 접근 권한이 없습니다. (선택사항)');
        // 403은 치명적이지 않으므로 무시
      } else if (response.status === 404) {
        console.error('채팅방을 찾을 수 없습니다.');
      }
    } catch (err) {
      console.warn('채팅방 정보 로드 실패 (선택사항):', err);
      // 채팅방 정보는 필수가 아니므로 에러를 무시
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(
        `http://localhost:8081/api/messages/${chatRoomId}?page=0&size=100&sort=createdAt,asc`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('채팅방에 접근할 권한이 없습니다.');
        } else if (response.status === 404) {
          throw new Error('채팅방을 찾을 수 없습니다.');
        } else {
          throw new Error('메시지를 불러오는데 실패했습니다.');
        }
      }

      const data: MessageResponse = await response.json();
      setMessages(data.data.filter(msg => !msg.deleted));
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      console.error('메시지 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = (token: string) => {
    // SockJS를 사용한 WebSocket 연결
    const socket = new SockJS('http://localhost:8081/ws-chat');
    
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str: string) => {
        console.log('STOMP:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket 연결됨');
        setIsConnected(true);

        // 채팅방 구독 - /sub/chat/room/{roomId}
        client.subscribe(`/sub/chat/room/${chatRoomId}`, (message: IMessage) => {
          const receivedMessage = JSON.parse(message.body);
          console.log('메시지 수신:', receivedMessage);
          
          // 받은 메시지를 ChatMessage 형식으로 변환
          const chatMessage: ChatMessage = {
            message: receivedMessage.message,
            sender: receivedMessage.sender,
            senderName: receivedMessage.senderName,
            createdAt: receivedMessage.createdAt,
            deleted: false,
          };
          
          setMessages((prev) => [...prev, chatMessage]);
        });
      },
      onStompError: (frame: IFrame) => {
        console.error('STOMP 오류:', frame.headers['message']);
        console.error('세부 정보:', frame.body);
        setError('연결 오류가 발생했습니다.');
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        console.log('WebSocket 연결 종료');
        setIsConnected(false);
      },
    });

    client.activate();
    stompClient.current = client;
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !stompClient.current || !isConnected) {
      return;
    }

    // MessageRequest 형식에 맞춰 데이터 전송
    const messageRequest = {
      roomId: Number(chatRoomId),
      message: inputMessage.trim(),
    };

    try {
      // /pub/chat/send로 메시지 전송
      stompClient.current.publish({
        destination: '/pub/chat/send',
        body: JSON.stringify(messageRequest),
      });

      console.log('메시지 전송:', messageRequest);
      setInputMessage('');
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setError('메시지 전송에 실패했습니다.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    }
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (isLoading) {
    return (
      <div className="chatting-container">
        {!embedded && <Header isLoggedIn={true} userName="사용자" />}
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>채팅을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="chatting-container">
        {!embedded && <Header isLoggedIn={true} userName="사용자" />}
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatting-container">
      {!embedded && <Header isLoggedIn={true} userName="사용자" />}
      
      <div className="chatting-content">
        <div className="chat-header">
          <div className="chat-header-info">
            <h2>{chatRoomInfo?.title || '채팅방'}</h2>
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '● 연결됨' : '○ 연결 끊김'}
            </span>
          </div>
        </div>

        <div className="messages-container">
          {Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="message-date-group">
              <div className="date-divider">
                <span>{formatDate(msgs[0].createdAt)}</span>
              </div>
              
              {msgs.map((msg, index) => {
                const isMyMessage = msg.sender === currentUserId;
                const showSender = index === 0 || msgs[index - 1].sender !== msg.sender;
                
                return (
                  <div
                    key={`${msg.sender}-${msg.createdAt}-${index}`}
                    className={`message-wrapper ${isMyMessage ? 'my-message' : 'other-message'}`}
                  >
                    {!isMyMessage && showSender && (
                      <div className="message-sender">{msg.senderName}</div>
                    )}
                    <div className="message-content-wrapper">
                      <div className="message-bubble">
                        <p className="message-text">{msg.message}</p>
                      </div>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <button className="attach-button" aria-label="파일 첨부">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <input
              type="text"
              className="message-input"
              placeholder="메시지를 입력하세요"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !isConnected}
              aria-label="전송"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatting;