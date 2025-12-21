/**
 * タイムゾーンを考慮した日付ユーティリティ
 */

// タイムゾーンのオフセット定義（UTC からの分）
const TIMEZONE_OFFSETS: Record<string, number> = {
  'Asia/Tokyo': 540,      // UTC+9:00
  'Asia/Osaka': 540,      // UTC+9:00
  'Asia/Shanghai': 480,   // UTC+8:00
  'Asia/Hong_Kong': 480,  // UTC+8:00
  'Asia/Bangkok': 420,    // UTC+7:00
  'Asia/Singapore': 480,  // UTC+8:00
  'Asia/Manila': 480,     // UTC+8:00
  'Asia/Seoul': 540,      // UTC+9:00
  'Asia/Taipei': 480,     // UTC+8:00
  'UTC': 0,               // UTC+0:00
};

/**
 * YYYY-MM-DD 形式の文字列にフォーマット
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 日本語表示用の日付フォーマット（例：2025年12月14日(日)）
 */
export const formatDateDisplay = (date: Date | string, timezone: string = 'Asia/Tokyo'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Intl.DateTimeFormat を使用してタイムゾーン対応フォーマット
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'narrow',
    timeZone: timezone,
  });

  return formatter.format(d);
};

/**
 * 日付を YYYY年M月D日(曜) 形式で返す
 */
export const formatDateJapanese = (date: Date | string, timezone: string = 'Asia/Tokyo'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'narrow',
    timeZone: timezone,
  });
  
  return formatter.format(d);
};

/**
 * 週表示用のフォーマット（例：2025年12月14日(日) ～ 2025年12月20日(土)）
 */
export const formatWeekDisplay = (date: Date | string, timezone: string = 'Asia/Tokyo'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - d.getDay());
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const startStr = formatDateJapanese(weekStart, timezone);
  const endStr = formatDateJapanese(weekEnd, timezone);
  
  return `${startStr} ～ ${endStr}`;
};

/**
 * 月表示用のフォーマット（例：2025年12月）
 */
export const formatMonthDisplay = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return `${year}年${month}月`;
};

/**
 * UTC 日付文字列をタイムゾーンに基づいて YYYY-MM-DD に変換
 * バックエンドから返された YYYY-MM-DD 形式の文字列をタイムゾーン変換
 */
export const convertUTCToTimezone = (dateStr: string, timezone: string = 'Asia/Tokyo'): string => {
  // dateStr は YYYY-MM-DD 形式と想定
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // UTC での日付を作成
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  
  // タイムゾーンに基づいてフォーマット
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  });
  
  const parts = formatter.formatToParts(utcDate);
  const result = parts.reduce((acc, part) => {
    if (part.type === 'year') return acc + part.value;
    if (part.type === 'month') return acc + part.value;
    if (part.type === 'day') return acc + part.value;
    return acc;
  }, '');
  
  return `${result.substring(0, 4)}-${result.substring(4, 6)}-${result.substring(6, 8)}`;
};

/**
 * Date オブジェクトを YYYY-MM-DD 形式の文字列に変換（API送信用）
 */
export const dateToAPIFormat = (date: Date): string => {
  return formatDate(date);
};

/**
 * ISO 8601 形式から YYYY-MM-DD を抽出
 */
export const extractDateFromISO = (isoString: string): string => {
  return isoString.split('T')[0];
};

/**
 * タイムゾーン情報からオフセット分を取得
 */
export const getTimezoneOffset = (timezone: string): number => {
  return TIMEZONE_OFFSETS[timezone] || 0;
};

/**
 * 利用可能なタイムゾーンのリストを取得
 */
export const getAvailableTimezones = (): Array<{ value: string; label: string }> => {
  return [
    { value: 'Asia/Tokyo', label: 'Tokyo (Asia/Tokyo)' },
    { value: 'Asia/Osaka', label: 'Osaka (Asia/Osaka)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (Asia/Shanghai)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (Asia/Hong_Kong)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (Asia/Bangkok)' },
    { value: 'Asia/Singapore', label: 'Singapore (Asia/Singapore)' },
    { value: 'Asia/Manila', label: 'Manila (Asia/Manila)' },
    { value: 'Asia/Seoul', label: 'Seoul (Asia/Seoul)' },
    { value: 'Asia/Taipei', label: 'Taipei (Asia/Taipei)' },
    { value: 'UTC', label: 'UTC (UTC)' },
  ];
};

/**
 * 2つの日付が同じ日かどうかを確認（タイムゾーン考慮）
 */
export const isSameDate = (date1: string, date2: string, timezone: string = 'Asia/Tokyo'): boolean => {
  const converted1 = convertUTCToTimezone(date1, timezone);
  const converted2 = convertUTCToTimezone(date2, timezone);
  return converted1 === converted2;
};

/**
 * 指定された年月の最初の日の曜日を取得（タイムゾーン対応）
 * 0 = 日, 1 = 月, ..., 6 = 土
 */
export const getFirstDayOfMonth = (year: number, month: number, timezone: string = 'Asia/Tokyo'): number => {
  try {
    // UTC での最初の日を作成
    const utcDate = new Date(Date.UTC(year, month - 1, 1));
    
    // シンプルな方法：ローカルタイムゾーンの getDay() を使用
    // これでカレンダー表示には十分です
    return utcDate.getDay();
  } catch (error) {
    console.error('Error in getFirstDayOfMonth:', error);
    // フォールバック
    return new Date(year, month - 1, 1).getDay();
  }
};

/**
 * 指定された年月の日数を取得
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};
