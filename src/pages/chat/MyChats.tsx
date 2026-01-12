import { useState, useEffect } from 'react';
import Header from '../../components/header';
import Tag from '../../components/Tag';
import ChatCreate from '../../components/ChatCreate';
import Chatting from './Chatting';
import './styles/MyChats.css';

interface ChatRoom {
  chatRoomId: number;
  title: string;
  tag: string;
  author: string;
  createdAt: string;
}

interface ApiResponse {
  data: ChatRoom[];
  message: string;
  success: boolean;
}

interface CreatedChat {
  chatId: number;
  title: string;
  tag: string[];
  createdAt: string;
}

const MyChats = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async (dateFilter?: string, tag?: string) => {
    setIsLoading(true);
    setError(null);
  
    try {
      const params = new URLSearchParams();
  
      if (dateFilter) {
        params.append('datefilter', dateFilter);
      }
  
      if (tag) {
        params.append('tag', tag);
      }
  
      const response = await fetch(
        `http://localhost:8081/api/chats/me?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('채팅 목록을 불러오는데 실패했습니다.');
      }
  
      const data: ApiResponse = await response.json();
      setChatRooms(data.data);
      
      // 채팅 목록이 있으면 첫 번째 채팅을 자동 선택
      if (data.data.length > 0 && !selectedChatId) {
        setSelectedChatId(data.data[0].chatRoomId);
      } else if (data.data.length === 0) {
        setSelectedChatId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleChatCreated = (chat: CreatedChat) => {
    // 새로운 채팅이 생성되면 목록을 다시 불러오기
    fetchChatRooms();
    // 생성된 채팅을 선택
    setSelectedChatId(chat.chatId);
  };

  const handleChatClick = (chatRoomId: number) => {
    setSelectedChatId(chatRoomId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 24) {
      return `${hours}시간 전`;
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const filterOptions = [
    { value: 'all', label: '전체' },
    { value: 'IN_PROGRESS', label: '진행중' },
    { value: 'ADOPT', label: '채택됨' },
    { value: 'REJECT', label: '반려' },
    { value: 'END', label: '종료' },
  ];

  return (
    <div className="my-chats-container">
      <Header isLoggedIn={true} userName="사용자" />
      
      <div className="my-chats-content">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>내 채팅</h2>
          </div>

          <div className="filter-section">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                className={`filter-btn ${selectedFilter === option.value ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFilter(option.value);
                  if (option.value === 'all') {
                    fetchChatRooms();
                  } else {
                    fetchChatRooms(undefined, option.value);
                  }
                }}
              >
                <span className="filter-label">{option.label}</span>
                <span className="filter-arrow">›</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="main-content">
          {isLoading ? (
            <div className="loading-state">
              <p>로딩 중...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-content">
                <h3>채팅 생성하기</h3>
                <p>질문이나 고민, 당신의 생각을 자유롭게 나눠보세요!</p>
                <button 
                  className="create-chat-btn"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  +
                </button>
                <p className="create-hint">버튼을 눌러 새로운 채팅을 생성해보세요</p>
              </div>
            </div>
          ) : (
            <div className="chat-list-with-detail">
              <div className="chat-list-section">
                <div className="chat-list-header">
                  <h2>내 채팅 목록</h2>
                  <button 
                    className="new-chat-btn"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    +
                  </button>
                </div>
                <div className="chat-list">
                  {chatRooms.map((chat) => (
                    <div
                      key={chat.chatRoomId}
                      className={`chat-item ${selectedChatId === chat.chatRoomId ? 'selected' : ''}`}
                      onClick={() => handleChatClick(chat.chatRoomId)}
                    >
                      <div className="chat-item-header">
                        <h3 className="chat-title">{chat.title}</h3>
                        <Tag tag={chat.tag} />
                      </div>
                      <div className="chat-item-footer">
                        <span className="chat-author">{chat.author}</span>
                        <span className="chat-date">{formatDate(chat.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedChatId && (
                <div className="chat-detail-section">
                  <Chatting chatRoomId={selectedChatId} embedded={true} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <ChatCreate
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default MyChats;