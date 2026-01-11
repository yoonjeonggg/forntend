import './styles/Tag.css';

export type TagType = 'IN_PROGRESS' | 'ADOPT' | 'REJECT' | 'END' | string;

interface TagProps {
  tag: TagType;
  isBest?: boolean;
  label?: string;
}

const tagNames: { [key: string]: string } = {
  IN_PROGRESS: '진행중',
  ADOPT: '채택됨',
  REJECT: '반려',
  END: '종료',
};

export default function Tag({ tag, isBest = false, label }: TagProps) {
  const getTagClassName = (tagValue: string, isBestTag: boolean) => {
    if (isBestTag) return 'tag-best';
    if (tagValue === 'ADOPT') return 'tag-adopt';
    if (tagValue === 'IN_PROGRESS') return 'tag-progress';
    if (tagValue === 'REJECT') return 'tag-reject';
    if (tagValue === 'END') return 'tag-end';
    return 'tag-progress';
  };

  const displayLabel = label || tagNames[tag] || tag;

  return (
    <span className={getTagClassName(tag, isBest)}>
      {displayLabel}
    </span>
  );
}
