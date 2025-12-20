import React from 'react';
import { ReservationDto } from '@myorg/shared/dto/reservation.dto';
import { formatInTimezone } from '@myorg/shared/utils/date.util';

interface Props {
  startOfWeek: Date;               // 任意の日付（この日が属する週の月曜を基準に算出）
  reservations: ReservationDto[];
  workdays: number[];              // 表示したい曜日（0‑6）だけ残す
  timezone: string;
}

/** 与えられた Date が UTC のまま扱われる点に注意 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // Sun=0 … Sat=6
  const diff = (day + 6) % 7; // 月曜までの差分
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

export default function WeekView({
  startOfWeek,
  reservations,
  workdays,
  timezone,
}: Props) {
  const monday = getMonday(startOfWeek);

  // 7 日分の配列を作成
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">週次予約</h2>

      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-gray-100">
            {days.map((d, idx) => {
              if (!workdays.includes(d.getUTCDay())) return null;
              const label = new Intl.DateTimeFormat('ja-JP', {
                weekday: 'short',
                month: '2-digit',
                day: '2-digit',
              }).format(d);
              return (
                <th key={idx} className="border p-2">
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          <tr>
            {days.map((d, idx) => {
              if (!workdays.includes(d.getUTCDay())) return null;
              const dayReservations = reservations.filter((r) => {
                const rd = new Date(r.startUtc);
                return (
                  rd.getUTCFullYear() === d.getUTCFullYear() &&
                  rd.getUTCMonth() === d.getUTCMonth() &&
                  rd.getUTCDate() === d.getUTCDate()
                );
              });

              return (
                <td key={idx} className="border align-top p-2">
                  {dayReservations.length === 0 ? (
                    <span className="text-gray-500">―</span>
                  ) : (
                    dayReservations.map((r) => (
                      <div key={r.id} className="mb-1 text-sm border-b pb-1">
                        {r.doctor?.employee?.name ?? '医師未設定'}<br />
                        {formatInTimezone(r.startUtc, timezone)}〜
                        {formatInTimezone(r.endUtc, timezone)}
                      </div>
                    ))
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
