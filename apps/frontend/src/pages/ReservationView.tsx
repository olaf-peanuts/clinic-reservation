import React, { useEffect, useState } from 'react';
import api from '../services/api';
import CalendarHeader from '../components/CalendarHeader';
import DayView from '../components/DayView';
import WeekView from '../components/WeekView';
import MonthView from '../components/MonthView';
import { ReservationDto } from '@myorg/shared/dto/reservation.dto';

type ViewMode = 'day' | 'week' | 'month';

export default function ReservationView() {
  const [view, setView] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [workdays, setWorkdays] = useState<number[]>([]); // 0=Sun … 6=Sat
  const [timezone, setTimezone] = useState<string>('UTC');

  // ---- 初期データ取得 ----
  useEffect(() => {
    // タイムゾーンはブラウザの設定を使用（ユーザーが変更したら別途 API に保存可能）
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, []);

  // 診療曜日取得
  useEffect(() => {
    api.get<number[]>('/schedules/days').then((res) => setWorkdays(res.data));
  }, []);

  // 予約一覧取得（全件取得してフロント側でフィルタリング）
  useEffect(() => {
    api.get<ReservationDto[]>('/reservations').then((res) => setReservations(res.data));
  }, [currentDate, view]);

  // 前・次ボタンのハンドラ
  const shift = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      {/* ヘッダー：ビュー切替・期間移動 */}
      <CalendarHeader
        view={view}
        onViewChange={setView}
        onPrev={() => shift(view === 'day' ? -1 : view === 'week' ? -7 : -30)}
        onNext={() => shift(view === 'day' ? 1 : view === 'week' ? 7 : 30)}
        currentDate={currentDate}
      />

      {/* ビュー本体 */}
      {view === 'day' && (
        <DayView
          date={currentDate}
          reservations={reservations.filter((r) => {
            const d = new Date(r.startUtc);
            return (
              d.getUTCFullYear() === currentDate.getUTCFullYear() &&
              d.getUTCMonth() === currentDate.getUTCMonth() &&
              d.getUTCDate() === currentDate.getUTCDate()
            );
          })}
          timezone={timezone}
        />
      )}
      {view === 'week' && (
        <WeekView
          startOfWeek={currentDate}
          reservations={reservations}
          workdays={workdays}
          timezone={timezone}
        />
      )}
      {view === 'month' && (
        <MonthView
          monthDate={currentDate}
          reservations={reservations}
          workdays={workdays}
          timezone={timezone}
        />
      )}
    </div>
  );
}
