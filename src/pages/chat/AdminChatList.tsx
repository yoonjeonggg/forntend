import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header';
import { getAdminChats } from '../../services/admin';
import './AdminChatList.css';

type ChatTag = 'IN_PROGRESS' | 'ADOPT' | 'REJECT' | 'END';
type DateFilter = 'RECENT' | 'OLDEST';

interface AdminChat {
  chatRoomId: number;
  title: string;
  tag: ChatTag;
  author: string;
  studentNum: number;
  createdAt: string;
}

export default function AdminChatList() {
  const navigate = useNavigate();

  const [chatTag, setChatTag] = useState<ChatTag | undefined>(undefined);
  const [dateFilter, setDateFilter] = useState<DateFilter>('RECENT');
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [chats, setChats] = useState<AdminChat[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const data = await getAdminChats({
        chatTags: chatTag,
        dateFilter,
        page,
        size,
      });

      setChats(data.content);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      alert(e.message || '관리자 채팅 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [chatTag, dateFilter, page]);

  const tagText = (tag: ChatTag) => {
    switch (tag) {
      case 'IN_PROGRESS':
        return '진행중';
      case 'ADOPT':
        return '채택';
      case 'REJECT':
        return '반려';
      case 'END':
        return '종료';
    }
  };

  return (
    <div className="admin-chat-page">
      <Header />

      <div className="admin-chat-container">
        {/* 채팅 목록 */}
        <section className="chat-section">
          <div className="top-bar">
            <input placeholder="채팅 제목 검색 (추후)" disabled />
          </div>

          <div className="chat-list">
            {loading && <p className="empty">로딩 중...</p>}

            {!loading && chats.length === 0 && (
              <p className="empty">채팅이 없습니다.</p>
            )}

            {!loading &&
              chats.map((chat) => (
                <div
                  key={chat.chatRoomId}
                  className="chat-item"
                  onClick={() =>
                    navigate(`/admin/chats/${chat.chatRoomId}`)
                  }
                >
                  <span className={`tag ${chat.tag.toLowerCase()}`}>
                    {tagText(chat.tag)}
                  </span>

                  <h4>{chat.title}</h4>

                  <p className="meta">
                    {chat.author} · {chat.studentNum} ·{' '}
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>

          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              이전
            </button>
            <span>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              다음
            </button>
          </div>
        </section>

        {/* 필터 */}
        <aside className="filter-box">
          <h4>필터</h4>

          <div className="filter-group">
            <span>날짜</span>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as DateFilter);
                setPage(0);
              }}
            >
              <option value="RECENT">최신순</option>
              <option value="OLDEST">오래된순</option>
            </select>
          </div>

          <div className="filter-group">
            <span>태그</span>
            <ul>
              <li onClick={() => { setChatTag('IN_PROGRESS'); setPage(0); }}>진행중</li>
              <li onClick={() => { setChatTag('ADOPT'); setPage(0); }}>채택</li>
              <li onClick={() => { setChatTag('REJECT'); setPage(0); }}>반려</li>
              <li onClick={() => { setChatTag('END'); setPage(0); }}>종료</li>
              <li onClick={() => { setChatTag(undefined); setPage(0); }}>전체</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
