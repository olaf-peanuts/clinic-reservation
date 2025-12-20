/**
 * UTC の Date オブジェクトを、指定された IANA タイムゾーンで文字列化するユーティリティ。
 * フロント側の表示やメール本文で利用します。
 */
export function formatInTimezone(
  utcDate: string | Date,
  tz: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
    ...options,
  }).format(date);
}
