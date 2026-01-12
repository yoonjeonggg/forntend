import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  /* =========================
     상태
  ========================= */
  const [chatTag, setChatTag] = useState<ChatTag | undefined>();
  const [dateFilter, setDateFilter] = useState<DateFilter>('RECENT');
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [chats, setChats] = useState<AdminChat[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  /* =========================
     데이터 조회
  ========================= */
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
      alert(e.message || '채팅 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [chatTag, dateFilter, page]);

  /* =========================
     UI 헬퍼
  ========================= */
  const renderTagText = (tag: ChatTag) => {
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

  /* =========================
     렌더링
  ========================= */
  return (
    <div className="admin-chat-list">
      {/* 상단 검색 영역 (추후 확장용) */}
      <div className="top-bar">
        <input
          type="text"
          placeholder="채팅 제목 검색"
          disabled
        />
      </div>

      <div className="content">
        {/* 채팅 목록 */}
        <div className="chat-list">
          {loading && <p>로딩 중...</p>}

          {!loading && chats.length === 0 && (
            <p>채팅 내역이 없습니다.</p>
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
                  {renderTagText(chat.tag)}
                </span>

                <h4>{chat.title}</h4>

                <p className="meta">
                  {chat.author} · {chat.studentNum} ·{' '}
                  {new Date(chat.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>

        {/* 필터 영역 */}
        <aside className="filter-box">
          <h4>필터링</h4>

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
              <li onClick={() => setChatTag('IN_PROGRESS')}>진행중</li>
              <li onClick={() => setChatTag('ADOPT')}>채택</li>
              <li onClick={() => setChatTag('REJECT')}>반려</li>
              <li onClick={() => setChatTag('END')}>종료</li>
              <li onClick={() => setChatTag(undefined)}>전체</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* 페이지네이션 */}
      <div className="pagination">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          이전
        </button>

        <span>
          {page + 1} / {totalPages}
        </span>

        <button
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}
