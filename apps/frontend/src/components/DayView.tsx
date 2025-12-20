import React from 'react';
import { ReservationDto } from '@myorg/shared/dto/reservation.dto';
import { formatInTimezone } from '@myorg/shared/utils/date.util';

interface Props {
  date: Date;
  reservations: ReservationDto[];
  timezone: string; // IANA タイムゾーン（例: "Asia/Tokyo"）
}

export default function DayView({ date, reservations, timezone }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">
        {date.toLocaleDateString('ja-JP')} の予約
      </h2>

      {reservations.length === 0 ? (
        <p className="text-gray-600">予約はありません。</p>
      ) : (
        <ul className="space-y-3">
          {reservations.map((r) => (
            <li key={r.id} className="border p-3 rounded bg-white shadow-sm">
              <div><strong>{r.doctor?.employee?.name ?? '医師未設定'}</strong></div>
              <div>
                時間:{' '}
                {formatInTimezone(r.startUtc, timezone)} 〜{' '}
                {formatInTimezone(r.endUtc, timezone)}
              </div>
              <div>社員: {r.employee?.name ?? ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
