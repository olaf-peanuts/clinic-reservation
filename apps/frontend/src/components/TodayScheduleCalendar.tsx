import React, { useState, useEffect } from 'react';
import { api, reservationApi } from '@/api/client';
import Toast from './Toast';
import ErrorDialog from './ErrorDialog';
import { 
  formatDate, 
  formatDateDisplay, 
  formatWeekDisplay, 
  formatMonthDisplay,
  convertUTCToTimezone,
  extractDateFromISO,
} from '@/utils/datetime';

// 共有インターフェース
interface IEmployee {
  employeeId: string;
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
}

interface TimePeriod {
  id?: number;
  scheduleId?: number;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DoctorSchedule {
  id: number;
  doctorId: number;
  date: string;
  timePeriods: TimePeriod[];
  appointments?: Array<{
    id: number;
    startAt: string;
    endAt: string;
    durationMinutes: number;
    employee: IEmployee;
  }>;
  doctor: {
    id: number;
    name: string;
    email: string;
    honorific?: string;
    defaultDurationMinutes?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
}

interface Doctor {
  id: number;
  name: string;
  defaultDurationMinutes?: number;
}

interface TodayScheduleCalendarProps {
  viewMode?: 'day' | 'week' | 'month';
  onNavigationChange?: (date: Date) => void;
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
  numberOfRooms?: number;
}

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      slots.push({
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        hour,
        minute,
      });
    }
  }
  return slots;
};

export default function TodayScheduleCalendar({ viewMode: propViewMode = 'day', initialDate, onDateChange, numberOfRooms }: TodayScheduleCalendarProps = {}) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode] = useState<'day' | 'week' | 'month'>(propViewMode);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const timeSlots = generateTimeSlots();

  // 診療予約モーダルの状態
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    doctorId: '',
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    employeeCompany: '',
    employeeDepartment: '',
    reservationContent: '',
    startTime: '09:00',
    endTime: '10:00',
  });
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mock関数：社員情報を取得（現在はMockで常に「佐藤次郎」の情報を返す）
  const fetchEmployeeInfo = async (employeeId: string): Promise<IEmployee> => {
    // 本来はAzureADに接続して社員情報を取得
    // 現在はMockで常に以下の情報を返す
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          employeeId,
          name: '佐藤次郎',
          email: 'satou.jiro@example.com',
          department: '医療事業部',
          jobTitle: undefined,
        });
      }, 300);
    });
  };

  const handleSearchEmployee = async () => {
    if (!reservationForm.employeeId.trim()) {
      setErrorMessage('社員番号を入力してください');
      setShowErrorDialog(true);
      return;
    }

    try {
      setReservationError(null);
      // 全角数字を半角に変換
      const normalizedEmployeeId = reservationForm.employeeId
        .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
      
      const employeeInfo = await fetchEmployeeInfo(normalizedEmployeeId);
      console.log('Employee info fetched:', employeeInfo);
      
      const newForm = {
        ...reservationForm,
        employeeId: normalizedEmployeeId,
        employeeName: employeeInfo.name,
        employeeEmail: employeeInfo.email,
        employeeCompany: '本社',
        employeeDepartment: employeeInfo.department || '',
      };
      console.log('Setting reservation form:', newForm);
      setReservationForm(newForm);
      setToastMessage('社員情報を取得しました');
    } catch (error) {
      setErrorMessage('社員情報の取得に失敗しました');
      setShowErrorDialog(true);
      console.error('Error fetching employee info:', error);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // initialDateが変更されたときにselectedDateを更新
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateStr = formatDate(selectedDate);
        console.log('TodayScheduleCalendar: Fetching doctors');
        console.log('TodayScheduleCalendar: Fetching schedules for', selectedDate);
        console.log('TodayScheduleCalendar: Date string:', dateStr);

        const [doctorsRes, schedulesRes] = await Promise.all([
          api.get('/doctors').catch(() => ({ data: [] })),
          api.get(`/doctor-schedules?date=${dateStr}`).catch(() => ({ data: [] })),
        ]);

        const doctorsList = doctorsRes.data || [];
        const schedulesList = schedulesRes.data || [];

        setDoctors(doctorsList);
        setSchedules(schedulesList);

        console.log('TodayScheduleCalendar: Doctors fetched:', doctorsList);
        console.log('TodayScheduleCalendar: Schedules fetched:', schedulesList);
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, viewMode]);

  const doctorsList = doctors.map(d => ({
    id: d.id,
    name: d.name,
    defaultDurationMinutes: d.defaultDurationMinutes || 30,
  }));

  return (
    <div className="bg-white rounded-lg shadow">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-left">
            <h2 className="text-lg font-bold">
              {viewMode === 'day' && '本日の予定'}
              {viewMode === 'week' && '今週の予定'}
              {viewMode === 'month' && '今月の予定'}
            </h2>
          </div>
          <div className="flex gap-2 justify-center flex-col items-center">
            <p className="text-sm text-green-100">{formatDateDisplay(selectedDate)}</p>
            <div className="flex gap-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                if (viewMode === 'day') {
                  newDate.setDate(newDate.getDate() - 1);
                } else if (viewMode === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else if (viewMode === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                }
                handleDateChange(newDate);
              }}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm font-medium transition-colors"
            >
              {viewMode === 'day' && '← 前日へ'}
              {viewMode === 'week' && '← 前週へ'}
              {viewMode === 'month' && '← 前月へ'}
            </button>
            <button
              onClick={() => handleDateChange(new Date())}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm font-medium transition-colors"
            >
              {viewMode === 'day' && '今日'}
              {viewMode === 'week' && '今週'}
              {viewMode === 'month' && '今月'}
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                if (viewMode === 'day') {
                  newDate.setDate(newDate.getDate() + 1);
                } else if (viewMode === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else if (viewMode === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                }
                handleDateChange(newDate);
              }}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm font-medium transition-colors"
            >
              {viewMode === 'day' && '翌日へ →'}
              {viewMode === 'week' && '翌週へ →'}
              {viewMode === 'month' && '翌月へ →'}
            </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                // 医師のスケジュールをチェック
                let hasSchedule = false;
                
                if (doctors.length === 1) {
                  // 医師が1人の場合、その医師のスケジュールをチェック
                  const doctorSchedules = schedules.filter(s => s.doctorId === doctors[0].id);
                  hasSchedule = doctorSchedules.length > 0;
                  
                  if (!hasSchedule) {
                    setErrorMessage('選択された医師のスケジュールが設定されていません。スケジュール登録後にご利用ください。');
                    setShowErrorDialog(true);
                    return;
                  }
                  
                  setReservationForm({
                    doctorId: doctors[0].id.toString(),
                    employeeId: '',
                    employeeName: '',
                    employeeEmail: '',
                    employeeCompany: '',
                    employeeDepartment: '',
                    reservationContent: '',
                    startTime: '09:00',
                    endTime: '10:00',
                  });
                } else {
                  // 医師が2人以上の場合、少なくとも1人の医師がスケジュールを持っているかチェック
                  hasSchedule = doctors.some(doctor => {
                    const doctorSchedules = schedules.filter(s => s.doctorId === doctor.id);
                    return doctorSchedules.length > 0;
                  });
                  
                  if (!hasSchedule) {
                    setErrorMessage('いずれかの医師のスケジュールが設定されていません。スケジュール登録後にご利用ください。');
                    setShowErrorDialog(true);
                    return;
                  }
                  
                  setReservationForm({
                    doctorId: '',
                    employeeId: '',
                    employeeName: '',
                    employeeEmail: '',
                    employeeCompany: '',
                    employeeDepartment: '',
                    reservationContent: '',
                    startTime: '09:00',
                    endTime: '10:00',
                  });
                }
                
                setShowReservationModal(true);
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium transition-colors text-sm"
            >
              診療予約
            </button>
          </div>
        </div>
      </div>

      {/* 予約ボタン */}
      <div className="p-4 border-b border-gray-200 flex gap-2 items-center justify-between">
        <div className="flex-1"></div>
        <div className="text-center flex-1">
          <h3 className="text-lg font-bold text-gray-800">診療予約</h3>
          <p className="text-sm text-gray-600">{formatDateDisplay(selectedDate)}</p>
        </div>
        <div className="flex-1"></div>
      </div>

      {/* 診療予約作成ボタン */}
      <div className="p-4 border-b border-gray-200 flex justify-end">
        <button
          onClick={() => {
            // 医師のスケジュールをチェック
            let hasSchedule = false;
            
            if (doctors.length === 1) {
              // 医師が1人の場合、その医師のスケジュールをチェック
              const doctorSchedules = schedules.filter(s => s.doctorId === doctors[0].id);
              hasSchedule = doctorSchedules.length > 0;
              
              if (!hasSchedule) {
                setErrorMessage('選択された医師のスケジュールが設定されていません。スケジュール登録後にご利用ください。');
                setShowErrorDialog(true);
                return;
              }
              
              setReservationForm({
                doctorId: doctors[0].id.toString(),
                employeeId: '',
                employeeName: '',
                employeeEmail: '',
                employeeCompany: '',
                employeeDepartment: '',
                reservationContent: '',
                startTime: '09:00',
                endTime: '10:00',
              });
            } else {
              // 医師が2人以上の場合、少なくとも1人の医師がスケジュールを持っているかチェック
              hasSchedule = doctors.some(doctor => {
                const doctorSchedules = schedules.filter(s => s.doctorId === doctor.id);
                return doctorSchedules.length > 0;
              });
              
              if (!hasSchedule) {
                setErrorMessage('いずれかの医師のスケジュールが設定されていません。スケジュール登録後にご利用ください。');
                setShowErrorDialog(true);
                return;
              }
              
              setReservationForm({
                doctorId: '',
                employeeId: '',
                employeeName: '',
                employeeEmail: '',
                employeeCompany: '',
                employeeDepartment: '',
                reservationContent: '',
                startTime: '09:00',
                endTime: '10:00',
              });
            }
            
            setShowReservationModal(true);
          }}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium transition-colors text-sm"
        >
          診療予約を作成
        </button>
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {loading && (
          <p className="text-center text-gray-600 py-4 text-sm">スケジュール読み込み中...</p>
        )}

        {!loading && schedules.length === 0 && (
          <p className="text-center text-gray-600 py-4 text-sm">スケジュール表示準備中です</p>
        )}

        {!loading && schedules.length > 0 && (
          <div>
            {/* Day View */}
            {viewMode === 'day' && (
              <div className="overflow-x-auto">
                <div className="inline-block w-full min-w-max">
                  <div className="flex border-b border-gray-300 bg-gray-50">
                    <div className="w-16 flex-shrink-0 border-r border-gray-200 p-2">
                      <p className="text-xs font-semibold text-gray-600">時刻</p>
                    </div>
                    {doctorsList.map(doctor => {
                      const schedule = schedules.find(s => s.doctorId === doctor.id);
                      const honorific = schedule?.doctor.honorific || '医師';
                      return (
                        <div key={doctor.id} className="flex-1 min-w-[140px] border-r border-gray-200 p-2 text-center">
                          <p className="text-xs font-semibold text-gray-700">{doctor.name} {honorific}</p>
                        </div>
                      );
                    })}
                  </div>

                  {timeSlots.map((slot) => (
                    <div key={slot.time} className="flex border-b border-gray-200 hover:bg-gray-50">
                      <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-2">
                        <p className="text-xs font-semibold text-gray-600">{slot.time}</p>
                      </div>
                      {doctorsList.map(doctor => {
                        const doctorSchedule = schedules.find(s => s.doctorId === doctor.id);
                        const isAvailable = doctorSchedule?.timePeriods.some(
                          tp => slot.time >= tp.startTime && slot.time < tp.endTime
                        ) || false;

                        // このスロットに予約があるか確認
                        const appointmentsInSlot = doctorSchedule?.appointments?.filter(apt => {
                          const aptDate = new Date(apt.startAt);
                          const aptHours = String(aptDate.getUTCHours()).padStart(2, '0');
                          const aptMinutes = String(aptDate.getUTCMinutes()).padStart(2, '0');
                          const aptTime = `${aptHours}:${aptMinutes}`;
                          console.log(`[Appointment Debug] Comparing ${aptTime} with slot ${slot.time}, appointment: ${apt.employee.name}`);
                          return aptTime === slot.time;
                        }) || [];

                        return (
                          <div key={`${doctor.id}-${slot.time}`} className="flex-1 min-w-[140px] border-r border-gray-200 p-1">
                            {appointmentsInSlot.length > 0 ? (
                              <div className="h-8 bg-blue-100 border border-blue-400 rounded text-xs flex items-center justify-center text-blue-900 font-semibold overflow-hidden">
                                {appointmentsInSlot[0].employee.name.substring(0, 4)}
                              </div>
                            ) : isAvailable ? (
                              <div className="h-8 bg-green-100 border border-green-400 rounded text-xs flex items-center justify-center text-green-900 font-semibold hover:bg-green-200 cursor-pointer">
                                ○
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const weekDate = new Date(selectedDate);
                  weekDate.setDate(weekDate.getDate() - weekDate.getDay() + i);
                  const dateStr = formatDate(weekDate);
                  const weekSchedules = schedules.filter(s => s.date === dateStr);

                  return (
                    <div key={i} className="border border-gray-300 rounded p-2 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-700 text-center mb-2">
                        {weekDate.toLocaleDateString('ja-JP', { weekday: 'short', month: '2-digit', day: '2-digit' })}
                      </p>
                      <div className="space-y-1">
                        {weekSchedules.length > 0 ? (
                          weekSchedules.map(schedule => (
                            <div key={schedule.id} className="text-xs bg-green-100 border border-green-400 rounded p-1 text-green-900">
                              {schedule.doctor.name} {schedule.doctor.honorific || '医師'}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 text-center">なし</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Month View */}
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-1">
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                  <div key={day} className="text-xs font-semibold text-gray-700 text-center py-2 border-b border-gray-300">
                    {day}
                  </div>
                ))}

                {Array.from({ length: 42 }).map((_, i) => {
                  const monthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                  monthDate.setDate(monthDate.getDate() - monthDate.getDay() + i);
                  const dateStr = formatDate(monthDate);
                  const monthSchedules = schedules.filter(s => s.date === dateStr);
                  const isCurrentMonth = monthDate.getMonth() === selectedDate.getMonth();

                  return (
                    <div key={i} className={`border border-gray-200 rounded p-1 min-h-[80px] ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-semibold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                        {monthDate.getDate()}
                      </p>
                      {monthSchedules.length > 0 && (
                        <p className="text-xs text-green-700 font-semibold mt-1">
                          {monthSchedules.length} 件
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          duration={3000}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* エラーダイアログ */}
      {showErrorDialog && errorMessage && (
        <ErrorDialog
          title="エラー"
          message={errorMessage}
          onClose={() => {
            setShowErrorDialog(false);
            setErrorMessage(null);
          }}
        />
      )}

      {/* 診療予約ダイアログモーダル */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-lg w-full max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">診療予約</h3>

            {/* 予約日付表示 */}
            <div className="mb-2 p-2 bg-green-50 rounded border border-green-200">
              <p className="text-xs text-gray-600">予約日付</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDateDisplay(selectedDate)}
              </p>
            </div>

            {/* エラーメッセージ */}
            {reservationError && (
              <Toast
                message={reservationError}
                type="error"
                duration={3000}
                onClose={() => setReservationError(null)}
              />
            )}

            {/* 医師選択 */}
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                医師
              </label>
              <select
                value={reservationForm.doctorId}
                onChange={(e) =>
                  setReservationForm({
                    ...reservationForm,
                    doctorId: e.target.value,
                  })
                }
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">医師を選択してください</option>
                {doctorsList.map(doctor => {
                  const schedule = schedules.find(s => s.doctorId === doctor.id);
                  const honorific = schedule?.doctor.honorific || '医師';
                  return (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} {honorific}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 社員番号入力と検索 */}
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                社員番号
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={reservationForm.employeeId}
                  onChange={(e) => {
                    console.log('[EmployeeId Input] Changed to:', e.target.value);
                    setReservationForm({
                      ...reservationForm,
                      employeeId: e.target.value,
                    })
                  }}
                  placeholder="例：10012345"
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSearchEmployee}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium transition-colors"
                >
                  検索
                </button>
              </div>
            </div>

            {/* 社員情報（リードオンリー） */}
            <div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  氏名
                </label>
                <input
                  type="text"
                  value={reservationForm.employeeName}
                  readOnly
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-gray-700"
                />
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="text"
                  value={reservationForm.employeeEmail}
                  readOnly
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    所属会社
                  </label>
                  <input
                    type="text"
                    value={reservationForm.employeeCompany}
                    readOnly
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    部署
                  </label>
                  <input
                    type="text"
                    value={reservationForm.employeeDepartment}
                    readOnly
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* 受信内容入力 */}
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                受信内容
              </label>
              <textarea
                value={reservationForm.reservationContent}
                onChange={(e) =>
                  setReservationForm({
                    ...reservationForm,
                    reservationContent: e.target.value,
                  })
                }
                placeholder="症状や相談内容を入力"
                rows={2}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* 受診時間帯 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  開始時刻
                </label>
                <select
                  value={reservationForm.startTime}
                  onChange={(e) => {
                    const startTime = e.target.value;
                    const selectedDoctor = doctorsList.find(d => d.id === parseInt(reservationForm.doctorId as string, 10));
                    const duration = selectedDoctor?.defaultDurationMinutes || 30;

                    const [hours, minutes] = startTime.split(':');
                    const startDate = new Date();
                    startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                    startDate.setMinutes(startDate.getMinutes() + duration);
                    
                    const endTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;

                    setReservationForm({
                      ...reservationForm,
                      startTime,
                      endTime: endTimeStr,
                    });
                  }}
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">選択してください</option>
                  {(() => {
                    const slots: string[] = [];
                    for (let hour = 8; hour <= 18; hour++) {
                      for (let minute = 0; minute < 60; minute += 5) {
                        slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
                      }
                    }
                    return slots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  終了時刻
                </label>
                <select
                  value={reservationForm.endTime}
                  onChange={(e) =>
                    setReservationForm({
                      ...reservationForm,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">選択してください</option>
                  {(() => {
                    const slots: string[] = [];
                    for (let hour = 8; hour <= 18; hour++) {
                      for (let minute = 0; minute < 60; minute += 5) {
                        slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
                      }
                    }
                    return slots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  // バリデーション
                  if (!reservationForm.doctorId) {
                    setReservationError('医師を選択してください');
                    return;
                  }
                  if (!reservationForm.employeeId) {
                    setReservationError('社員番号を入力してください');
                    return;
                  }
                  if (!reservationForm.reservationContent) {
                    setReservationError('受信内容を入力してください');
                    return;
                  }
                  if (reservationForm.startTime >= reservationForm.endTime) {
                    setReservationError('開始時刻は終了時刻より前である必要があります');
                    return;
                  }

                  // 選択医師のスケジュール確認
                  const doctorSchedules = schedules.filter(s => s.doctorId === parseInt(reservationForm.doctorId as string, 10));
                  const selectedDoctor = doctorsList.find(d => d.id === parseInt(reservationForm.doctorId as string, 10));

                  if (doctorSchedules.length === 0) {
                    setReservationError('この医師のスケジュールが設定されていません。スケジュール登録後にご利用ください。');
                    return;
                  }

                  // 時間の重複チェック
                  const hasConflict = doctorSchedules.some((schedule) => {
                    return (schedule.timePeriods || []).some(timePeriod => {
                      const reservationStart = reservationForm.startTime;
                      const reservationEnd = reservationForm.endTime;
                      const scheduleStart = timePeriod.startTime;
                      const scheduleEnd = timePeriod.endTime;

                      // 予約時間がスケジュール内に含まれているかチェック: 開始時刻 >= スケジュール開始 && 終了時刻 <= スケジュール終了
                      return !(reservationStart >= scheduleStart && reservationEnd <= scheduleEnd);
                    });
                  });

                  if (hasConflict) {
                    setReservationError('この時間帯は診療スケジュール外です。診療可能時間をご確認ください。');
                    return;
                  }

                  // API呼び出しして予約を保存
                  try {
                    const doctorId = parseInt(reservationForm.doctorId as string, 10);

                    // 社員番号を正規化（全角数字を半角に変換）
                    const normalizedEmployeeId = reservationForm.employeeId
                      .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

                    // 日付を YYYY-MM-DD 形式で取得
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    
                    // 開始時刻と終了時刻をローカルタイムゾーン対応で ISO 形式に変換
                    const [startHours, startMinutes] = reservationForm.startTime.split(':');
                    const [endHours, endMinutes] = reservationForm.endTime.split(':');
                    
                    // ローカルタイムゾーンをUTCオフセットで考慮した ISO 文字列を作成
                    const localStartDate = new Date(year, selectedDate.getMonth(), selectedDate.getDate(), 
                      parseInt(startHours, 10), parseInt(startMinutes, 10), 0);
                    const localEndDate = new Date(year, selectedDate.getMonth(), selectedDate.getDate(), 
                      parseInt(endHours, 10), parseInt(endMinutes, 10), 0);
                    
                    // UTC へ変換（ローカル時間をそのまま UTC として送信）
                    const utcStartAt = new Date(localStartDate.getTime() - localStartDate.getTimezoneOffset() * 60000).toISOString();
                    const durationMinutes = (localEndDate.getTime() - localStartDate.getTime()) / (1000 * 60);

                    console.log('[Reservation Debug] Sending reservation:', {
                      originalEmployeeId: reservationForm.employeeId,
                      normalizedEmployeeId,
                      doctorId,
                      selectedDate: `${year}-${month}-${day}`,
                      startTime: reservationForm.startTime,
                      endTime: reservationForm.endTime,
                      startAtISO: utcStartAt,
                      durationMinutes,
                      timezoneOffset: localStartDate.getTimezoneOffset(),
                    });

                    await reservationApi.create({
                      employeeId: normalizedEmployeeId,
                      doctorId,
                      startAt: utcStartAt,
                      durationMinutes: Math.round(durationMinutes),
                    });

                    // 成功時の処理
                    setShowReservationModal(false);
                    setReservationForm({
                      doctorId: '',
                      employeeId: '',
                      employeeName: '',
                      employeeEmail: '',
                      employeeCompany: '',
                      employeeDepartment: '',
                      reservationContent: '',
                      startTime: '09:00',
                      endTime: '10:00',
                    });
                    setReservationError(null);

                    // スケジュールを再読み込み
                    setToastMessage('予約が完了しました');
                    setTimeout(() => window.location.reload(), 1500);
                  } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || '予約の作成に失敗しました';
                    setReservationError(errorMessage);
                  }
                }}
                className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors"
              >
                予約確定
              </button>
              <button
                onClick={() => {
                  setShowReservationModal(false);
                  setReservationForm({
                    doctorId: '',
                    employeeId: '',
                    employeeName: '',
                    employeeEmail: '',
                    employeeCompany: '',
                    employeeDepartment: '',
                    reservationContent: '',
                    startTime: '09:00',
                    endTime: '10:00',
                  });
                  setReservationError(null);
                }}
                className="flex-1 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
