import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Header from '../../components/header';
import Tag from '../../components/Tag';
import FilterDropdown from '../../components/FilterDropdown';
import { fetchPublicBoard, searchPublicBoard, type DateFilter, type TagFilter } from '../../services/publicBoard';
import type { PublicBoardItem } from '../../types/board/PublicBoard';
import './PublicBoard.css';

export default function PublicBoard() {
  const navigate = useNavigate();
  const [boardItems, setBoardItems] = useState<PublicBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [datefilter, setDatefilter] = useState<DateFilter>('RECENT');
  const [tag, setTag] = useState<TagFilter | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }
  }, [navigate]);


  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    // 태그 검증: ADOPT, REJECT만 허용
    if (tag && tag !== 'ADOPT' && tag !== 'REJECT') {
      setError('필터링은 채택 또는 반려만 선택할 수 있습니다.');
      setBoardItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        let data: PublicBoardItem[];
        if (searchQuery.trim()) {
          data = await searchPublicBoard(searchQuery.trim());
        } else {
          data = await fetchPublicBoard({ datefilter, tag: tag || undefined });
        }
        setBoardItems(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
        setBoardItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [datefilter, tag, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 검색은 useEffect에서 자동으로 처리됨
  };

  return (
    <div>
      <Header />
      <div className="public-board-container">
        <div className="search-filter-section">
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="문의 채널 검색하기"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
          <FilterDropdown
            datefilter={datefilter}
            tag={tag}
            onDateFilterChange={setDatefilter}
            onTagFilterChange={setTag}
            allowedTags={['ADOPT', 'REJECT']}
          />
        </div>

        {isLoading ? (
          <div className="loading">불러오는 중...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <ul className="board-list">
            {Array.isArray(boardItems) && boardItems.map(item => (
              <li key={item.chatRoomId} className="board-item">
                <div className="board-item-content">
                  <div className="board-item-header">
                    {item.best && <Tag tag="" isBest={true} label="베스트 글" />}
                    <Tag tag={item.tag} />
                  </div>
                  <Link to={`/chats/${item.chatRoomId}`} className="board-title-link">
                    <h3 className="board-title">{item.title}</h3>
                  </Link>
                  <div className="board-meta">
                    <span>{item.author}</span>
                    <span>{(() => {
                      const date = new Date(item.createdAt);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}.${month}.${day}`;
                    })()}</span>
                  </div>
                </div>
                <div className="board-reactions">
                  <span>👍 {item.likeCnt}</span>
                  <span>👎 {item.dislikeCnt}</span>
                </div>
              </li>
            ))}
            {Array.isArray(boardItems) && boardItems.length === 0 && (
              <li className="empty">표시할 글이 없습니다.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
