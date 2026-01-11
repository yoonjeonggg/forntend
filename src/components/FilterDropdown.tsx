import { useEffect, useRef, useState } from 'react';
import type { DateFilter, TagFilter } from '../services/publicBoard';
import './styles/FilterDropdown.css';

interface FilterDropdownProps {
  datefilter: DateFilter;
  tag: TagFilter | '';
  onDateFilterChange: (filter: DateFilter) => void;
  onTagFilterChange: (tag: TagFilter | '') => void;
  allowedTags?: TagFilter[]; // 허용된 태그 목록 (기본값: ['ADOPT', 'REJECT'])
}

export default function FilterDropdown({
  datefilter,
  tag,
  onDateFilterChange,
  onTagFilterChange,
  allowedTags = ['ADOPT', 'REJECT'],
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDateSelect = (filter: DateFilter) => {
    onDateFilterChange(filter);
    setIsOpen(false);
  };

  const handleTagSelect = (selectedTag: TagFilter | '') => {
    onTagFilterChange(selectedTag);
    setIsOpen(false);
  };

  const tagLabels: { [key in TagFilter]: string } = {
    IN_PROGRESS: '진행중',
    ADOPT: '채택',
    REJECT: '반려',
    END: '종료',
  };

  return (
    <div className="filter-wrapper" style={{ position: 'relative' }} ref={filterRef}>
      <button
        type="button"
        className="filter-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        필터링
      </button>
      {isOpen && (
        <div className="filter-dropdown">
          <div className="filter-section">
            <div className="filter-section-title">날짜</div>
            <button
              type="button"
              className={`filter-option ${datefilter === 'RECENT' ? 'selected' : ''}`}
              onClick={() => handleDateSelect('RECENT')}
            >
              최신순
            </button>
            <button
              type="button"
              className={`filter-option ${datefilter === 'OLDEST' ? 'selected' : ''}`}
              onClick={() => handleDateSelect('OLDEST')}
            >
              오래된 순
            </button>
          </div>
          <div className="filter-section">
            <div className="filter-section-title">태그</div>
            <button
              type="button"
              className={`filter-option ${tag === '' ? 'selected' : ''}`}
              onClick={() => handleTagSelect('')}
            >
              전체
            </button>
            {allowedTags.map((tagOption) => (
              <button
                key={tagOption}
                type="button"
                className={`filter-option ${tag === tagOption ? 'selected' : ''}`}
                onClick={() => handleTagSelect(tagOption)}
              >
                {tagLabels[tagOption]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
