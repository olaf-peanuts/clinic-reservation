import React from 'react';

type ViewMode = 'day' | 'week' | 'month';

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  currentDate: Date;
}

export default function CalendarHeader({
  view,
  onViewChange,
  onPrev,
  onNext,
  currentDate,
}: Props) {
  const format = (date: Date) =>
    new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      date,
    );

  return (
    <div className="flex items-center justify-between mb-4">
      {/* ビュー切替ボタン */}
      <div>
        <button
          className={`px-3 py-1 mr-2 ${view === 'day' ? 'bg-blue-600 text-white' : ''}`}
          onClick={() => onViewChange('day')}
        >
          日
        </button>
        <button
          className={`px-3 py-1 mr-2 ${view === 'week' ? 'bg-blue-600 text-white' : ''}`}
          onClick={() => onViewChange('week')}
        >
          週
        </button>
        <button
          className={`px-3 py-1 ${view === 'month' ? 'bg-blue-600 text-white' : ''}`}
          onClick={() => onViewChange('month')}
        >
          月
        </button>
      </div>

      {/* 前後移動ボタン */}
      <div className="flex items-center">
        <button className="px-3 py-1 bg-gray-200 rounded-l" onClick={onPrev}>
          ◀︎
        </button>
        <span className="px-4">{format(currentDate)}</span>
        <button className="px-3 py-1 bg-gray-200 rounded-r" onClick={onNext}>
          ▶︎
        </button>
      </div>
    </div>
  );
}
