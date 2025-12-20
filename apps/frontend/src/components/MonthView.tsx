import React from 'react';
import { ReservationDto } from '@myorg/shared/dto/reservation.dto';
import { formatInTimezone } from '@myorg/shared/utils/date.util';

interface Props {
  monthDate: Date;                // 任意の日付（この月を表示）
  reservations: ReservationDto[];
  workdays: number[];             // 診療曜日（0‑6）だけハイライト
  timezone: string;
}

/** 月初日 (UTC) を取得 */
function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** 月末日 (UTC) を取得 */
function getMonthEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export default function MonthView({
  monthDate,
  reservations,
  workdays,
  timezone,
}: Props) {
  const start = getMonthStart(monthDate);
  const end = getMonthEnd(monthDate);

  // カレンダーは日曜開始（UTC）として計算
  const firstDayOfWeek = new Date(start);
  firstDayOfWeek.setUTCDate(firstDayOfWeek.getUTCDate() - firstDayOfWeek.getUTCDay());

  const totalDays =
    Math.ceil((end.getTime() - firstDayOfWeek.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const cells = Array.from({ length: totalDays }).map((_, i) => {
    const d = new Date(firstDayOfWeek);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">
        {monthDate.getUTCFullYear()}年{monthDate.getUTCMonth() + 1}月
      </h2>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-px bg-gray-300">
        {['日', '月', '火', '水', '木', '金', '土'].map((wd) => (
          <div key={wd} className="bg-white p-2 text-center font-medium">
            {wd}
          </div>
        ))}

        {/* カレンダーセル */}
        {cells.map((d, idx) => {
          const isCurrentMonth = d.getUTCMonth() === monthDate.getUTCMonth();
          const dayNumber = d.getUTCDate();

          // 診療曜日でなければ半透明に
          const allowed = workdays.includes(d.getUTCDay());

          // その日の予約一覧を取得
          const dayReservations = reservations.filter((r) => {
            const rd = new Date(r.startUtc);
            return (
              rd.getUTCFullYear() === d.getUTCFullYear() &&
              rd.getUTCMonth() === d.getUTCMonth() &&
              rd.getUTCDate() === d.getUTCDate()
            );
          });

          return (
            <div
              key={idx}
              className={`border p-2 min-h-[100px] bg-white ${
                isCurrentMonth ? '' : 'text-gray-400'
              } ${allowed ? '' : 'opacity-50'}`}
            >
              <div className="font-bold">{dayNumber}</div>
              {dayReservations.map((r) => (
                <div key={r.id} className="text-xs mt-1">
                  {r.doctor?.employee?.name ?? ''}<br />
                  {formatInTimezone(r.startUtc, timezone)}-
                  {formatInTimezone(r.endUtc, timezone)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
