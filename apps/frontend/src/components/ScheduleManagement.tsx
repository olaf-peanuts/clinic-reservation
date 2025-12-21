import React, { useState, useEffect } from 'react';
import { api, systemConfigApi } from '@/api/client';
import {
  convertUTCToTimezone,
  extractDateFromISO,
  isSameDate,
  getFirstDayOfMonth,
  getDaysInMonth,
} from '@/utils/datetime';

interface Doctor {
  id: number;
  name: string;
  email: string;
  azureObjectId: string;
  honorific?: string;
  defaultDurationMinutes?: number;
}

interface TimePeriod {
  startTime: string;
  endTime: string;
}

interface DoctorSchedule {
  id: number;
  doctorId: number;
  date: string | Date;
  timePeriods: TimePeriod[];
  doctor: Doctor;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleManagementProps {
  doctors: Doctor[];
  schedules: DoctorSchedule[];
  displayDaysOfWeek: number[];
  currentMonth: Date;
  onScheduleAdded: () => void;
  onMonthChange: (date: Date) => void;
  loading: boolean;
  error: string | null;
  numberOfRooms?: number;
}

interface NewScheduleState {
  doctorId: string;
  date: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export default function ScheduleManagement({
  doctors,
  schedules,
  displayDaysOfWeek,
  currentMonth,
  onScheduleAdded,
  onMonthChange,
  loading,
  error,
  numberOfRooms,
}: ScheduleManagementProps) {
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [clickedDate, setClickedDate] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
  const [timePeriods, setTimePeriods] = useState<Array<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>>([]);
  const [editingTimePeriods, setEditingTimePeriods] = useState<Array<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>>([]);
  const [newSchedule, setNewSchedule] = useState<NewScheduleState>({
    doctorId: '',
    date: '',
    startHour: 9,
    startMinute: 0,
    endHour: 17,
    endMinute: 0,
  });

  // 前回成功した追加時の医師と診療時間帯を記憶
  const [lastSavedDoctorId, setLastSavedDoctorId] = useState<string>('');
  const [lastSavedTimePeriods, setLastSavedTimePeriods] = useState<Array<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>>([]);
  
  // タイムゾーン設定
  const [timezone, setTimezone] = useState<string>('Asia/Tokyo');

  // タイムゾーン取得
  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const res = await systemConfigApi.getTimezone();
        setTimezone(res.data.timezone);
      } catch (err) {
        console.error('Failed to fetch timezone:', err);
      }
    };
    fetchTimezone();
  }, []);

  // モーダルを開く処理
  const handleOpenAddScheduleModal = (dateStr: string) => {
    setClickedDate(dateStr);
    // 日付だけを今すぐ更新
    setNewSchedule(prev => ({ ...prev, date: dateStr }));
    // モーダルを開く
    setShowAddScheduleModal(true);
    
    console.log('Opening modal for date:', dateStr);
    console.log('Current saved doctor:', lastSavedDoctorId);
    console.log('Current saved periods:', lastSavedTimePeriods);
  };

  // モーダル表示時に記憶値を復元する
  useEffect(() => {
    if (showAddScheduleModal) {
      console.log('Modal opened, applying saved data');
      
      // 記憶された医師があれば設定
      if (lastSavedDoctorId) {
        console.log('Setting doctor to:', lastSavedDoctorId);
        setNewSchedule(prev => ({ ...prev, doctorId: lastSavedDoctorId }));
      }
      
      // 記憶された時間帯があれば設定、なければデフォルト値
      if (lastSavedTimePeriods.length > 0) {
        console.log('Setting periods to saved:', lastSavedTimePeriods);
        setTimePeriods(lastSavedTimePeriods);
      } else if (timePeriods.length === 0) {
        console.log('Setting default periods');
        setTimePeriods([{
          startHour: 9,
          startMinute: 0,
          endHour: 17,
          endMinute: 0,
        }]);
      }
    }
  }, [showAddScheduleModal]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSchedule.doctorId || !newSchedule.date || timePeriods.length === 0) {
      return;
    }

    // Room capacity validation
    if (numberOfRooms && numberOfRooms > 0) {
      for (const period of timePeriods) {
        const periodStartTime = `${String(period.startHour).padStart(2, '0')}:${String(period.startMinute).padStart(2, '0')}`;
        const periodEndTime = `${String(period.endHour).padStart(2, '0')}:${String(period.endMinute).padStart(2, '0')}`;
        
        // Count doctors already scheduled for this date and overlapping time periods
        const doctorsInTimeSlot = schedules.filter(schedule => {
          const scheduleDate = typeof schedule.date === 'string' ? schedule.date : new Date(schedule.date).toISOString().split('T')[0];
          if (scheduleDate !== newSchedule.date) return false;
          
          // Check if any time periods overlap
          return schedule.timePeriods.some(existingPeriod => {
            const existingStart = existingPeriod.startTime;
            const existingEnd = existingPeriod.endTime;
            
            // Check for time overlap
            return !(periodEndTime <= existingStart || periodStartTime >= existingEnd);
          });
        }).length;
        
        if (doctorsInTimeSlot >= numberOfRooms) {
          alert(`この時間帯の診療室が満杯です（最大：${numberOfRooms}室）`);
          return;
        }
      }
    }

    try {
      const formattedPeriods = timePeriods.map(period => ({
        startTime: `${String(period.startHour).padStart(2, '0')}:${String(period.startMinute).padStart(2, '0')}`,
        endTime: `${String(period.endHour).padStart(2, '0')}:${String(period.endMinute).padStart(2, '0')}`,
      }));
      
      await api.post('/doctor-schedules', {
        doctorId: parseInt(newSchedule.doctorId),
        date: newSchedule.date,
        timePeriods: formattedPeriods,
      });
      
      // 追加に成功したら、医師と診療時間帯を記憶する
      console.log('Schedule added successfully. Saving:', {
        doctorId: newSchedule.doctorId,
        timePeriods: timePeriods
      });
      setLastSavedDoctorId(newSchedule.doctorId);
      setLastSavedTimePeriods(timePeriods);
      
      setShowAddScheduleModal(false);
      setNewSchedule({ doctorId: '', date: '', startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 });
      setTimePeriods([]);
      setClickedDate(null);
      onScheduleAdded();
    } catch (err) {
      console.error('Error adding schedule:', err);
    }
  };

  const handleEditSchedule = (scheduleId: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setEditingScheduleId(scheduleId);
      setEditingSchedule(schedule);
      
      const periods = (schedule.timePeriods || []).map(period => {
        const [startHour, startMinute] = period.startTime.split(':').map(Number);
        const [endHour, endMinute] = period.endTime.split(':').map(Number);
        return { startHour, startMinute, endHour, endMinute };
      });
      setEditingTimePeriods(periods.length > 0 ? periods : [{
        startHour: 9,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
      }]);
      setShowEditScheduleModal(true);
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingScheduleId === null || !editingSchedule || editingTimePeriods.length === 0) {
      return;
    }

    try {
      const formattedPeriods = editingTimePeriods.map(period => ({
        startTime: `${String(period.startHour).padStart(2, '0')}:${String(period.startMinute).padStart(2, '0')}`,
        endTime: `${String(period.endHour).padStart(2, '0')}:${String(period.endMinute).padStart(2, '0')}`,
      }));
      
      await api.put(`/doctor-schedules/${editingScheduleId}`, { timePeriods: formattedPeriods });
      
      setShowEditScheduleModal(false);
      setEditingScheduleId(null);
      setEditingSchedule(null);
      setEditingTimePeriods([]);
      onScheduleAdded();
    } catch (err) {
      console.error('Error updating schedule:', err);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!window.confirm('このスケジュールを削除しますか？')) {
      return;
    }

    try {
      await api.delete(`/doctor-schedules/${scheduleId}`);
      onScheduleAdded();
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-3">医師のスケジュール管理</h2>
      <p className="text-gray-600 mb-4 text-sm">カレンダーに診療時間帯を表示しています。追加・編集・削除ボタンから管理できます。</p>

      {loading && <p className="text-gray-600 text-sm">データ読み込み中...</p>}
      {error && <p className="text-red-600 text-sm">エラー: {error}</p>}

      {!loading && doctors.length === 0 && (
        <p className="text-gray-600 mb-4 text-sm">登録されている医師はいません。</p>
      )}

      {!loading && doctors.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
            >
              ← 前月
            </button>
            <h3 className="text-lg font-bold whitespace-nowrap">
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </h3>
            <button
              onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
            >
              翌月 →
            </button>
          </div>

          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
            {['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-1 text-xs">
                {day}
              </div>
            ))}
          </div>

          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
            {Array.from({ length: 42 }).map((_, index) => {
              const monthNumber = currentMonth.getMonth() + 1; // 1-12
              const year = currentMonth.getFullYear();
              const firstDay = getFirstDayOfMonth(year, monthNumber, timezone);
              const daysInMonth = getDaysInMonth(year, monthNumber);
              const dayNumber = index - firstDay + 1;
              const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
              const date = isCurrentMonth ? new Date(year, currentMonth.getMonth(), dayNumber) : null;
              const dayOfWeek = index % 7; // インデックスから曜日を計算（0=日, 1=月, ..., 6=土）
              const isDisplayDay = displayDaysOfWeek.includes(dayOfWeek);
              const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
              
              const daySchedules = isCurrentMonth ? schedules.filter(s => {
                // タイムゾーンを考慮した日付比較
                const scheduleDate = typeof s.date === 'string' ? s.date : new Date(s.date).toISOString().split('T')[0];
                return isSameDate(scheduleDate, dateStr, timezone);
              }) : [];

              // 非表示曜日の場合は空のセルを表示
              if (!isDisplayDay && isCurrentMonth) {
                return (
                  <div
                    key={index}
                    className="min-h-24 border rounded p-1 flex flex-col bg-gray-50 opacity-30"
                  />
                );
              }

              return (
                <div
                  key={index}
                  className={`min-h-24 border rounded p-1 flex flex-col text-xs ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-100'
                  }`}
                >
                  {isCurrentMonth && (
                    <>
                      <div className="font-semibold mb-1">{dayNumber}</div>
                      <div className="space-y-0.5 mb-1 flex-grow overflow-y-auto">
                        {daySchedules.map((schedule, idx) => (
                          <div key={idx} className="text-gray-700 bg-green-50 p-0.5 rounded text-xs">
                            <span className="font-semibold block">{schedule.doctor.name} {schedule.doctor.honorific || '医師'}</span>
                            {schedule.timePeriods && Array.isArray(schedule.timePeriods) && 
                              schedule.timePeriods.map((period: TimePeriod, pidx: number) => (
                                <div key={pidx} className="text-xs">
                                  {period.startTime}-{period.endTime}
                                </div>
                              ))
                            }
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-0.5 mt-auto pt-1 border-t">
                        <button
                          onClick={() => {
                            handleOpenAddScheduleModal(dateStr);
                          }}
                          className="flex-1 px-1 py-0.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-semibold"
                        >
                          + 追加
                        </button>
                        {daySchedules.length > 0 && (
                          <>
                            <button
                              onClick={() => handleEditSchedule(daySchedules[0].id)}
                              className="flex-1 px-1 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-semibold"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(daySchedules[0].id)}
                              className="flex-1 px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold"
                            >
                              削除
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">新規スケジュール追加</h3>
            <p className="text-sm text-gray-600 mb-4">医師が診療する日付と時間帯を設定してください。複数の時間帯を設定できます。</p>
            
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">医師</label>
                <select
                  value={newSchedule.doctorId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">選択してください</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}医師
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">日付</label>
                <input
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-800">診療時間帯</h4>
                
                {timePeriods.map((period, index) => (
                  <div key={index} className="border border-gray-200 rounded p-3 bg-white space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">{index + 1}番目の時間帯</span>
                      {timePeriods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTimePeriods(timePeriods.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          削除
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">開始時刻</label>
                        <div className="flex gap-1 items-center">
                          <select
                            value={period.startHour}
                            onChange={(e) => {
                              const newPeriods = [...timePeriods];
                              newPeriods[index].startHour = parseInt(e.target.value);
                              setTimePeriods(newPeriods);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {Array.from({ length: 24 }).map((_, h) => (
                              <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="text-sm font-semibold">:</span>
                          <select
                            value={period.startMinute}
                            onChange={(e) => {
                              const newPeriods = [...timePeriods];
                              newPeriods[index].startMinute = parseInt(e.target.value);
                              setTimePeriods(newPeriods);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {Array.from({ length: 12 }).map((_, m) => {
                              const minute = m * 5;
                              return <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>;
                            })}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">終了時刻</label>
                        <div className="flex gap-1 items-center">
                          <select
                            value={period.endHour}
                            onChange={(e) => {
                              const newPeriods = [...timePeriods];
                              newPeriods[index].endHour = parseInt(e.target.value);
                              setTimePeriods(newPeriods);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {Array.from({ length: 24 }).map((_, h) => (
                              <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="text-sm font-semibold">:</span>
                          <select
                            value={period.endMinute}
                            onChange={(e) => {
                              const newPeriods = [...timePeriods];
                              newPeriods[index].endMinute = parseInt(e.target.value);
                              setTimePeriods(newPeriods);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {Array.from({ length: 12 }).map((_, m) => {
                              const minute = m * 5;
                              return <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>;
                            })}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => setTimePeriods([...timePeriods, {
                    startHour: 9,
                    startMinute: 0,
                    endHour: 17,
                    endMinute: 0,
                  }])}
                  className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded font-semibold text-sm hover:bg-blue-200"
                >
                  + 診療時間帯追加
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddScheduleModal(false);
                    setClickedDate(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* スケジュール編集モーダル */}
      {showEditScheduleModal && editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">スケジュール編集</h3>
            <p className="text-sm text-gray-600 mb-4">医師のスケジュール時間帯を編集できます。</p>
            
            <form onSubmit={handleUpdateSchedule} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">医師: <span className="font-semibold">{editingSchedule.doctor.name} {editingSchedule.doctor.honorific || '医師'}</span></p>
                <p className="text-sm text-gray-600">日付: <span className="font-semibold">{editingSchedule.date instanceof Date ? editingSchedule.date.toLocaleDateString('ja-JP') : editingSchedule.date.split('T')[0]}</span></p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-800">診療時間帯</h4>
                
                {editingTimePeriods.map((period, index) => (
                  <div key={index} className="border border-gray-200 rounded p-3 bg-white space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">{index + 1}番目の時間帯</span>
                      {editingTimePeriods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditingTimePeriods(editingTimePeriods.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          削除
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">開始時刻</label>
                        <div className="flex gap-1 items-center">
                          <select
                            value={period.startHour}
                            onChange={(e) => {
                              const newPeriods = [...editingTimePeriods];
                              newPeriods[index].startHour = parseInt(e.target.value);
                              setEditingTimePeriods(newPeriods);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {Array.from({ length: 24 }).map((_, h) => (
                              <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="text-sm font-semibold">:</span>
                          <select
                            value={period.startMinute}
                            onChange={(e) => {
                              const newPeriods = [...editingTimePeriods];
                              newPeriods[index].startMinute = parseInt(e.target.value);
                              setEditingTimePeriods(newPeriods);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {Array.from({ length: 12 }).map((_, m) => {
                              const minute = m * 5;
                              return <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>;
                            })}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">終了時刻</label>
                        <div className="flex gap-1 items-center">
                          <select
                            value={period.endHour}
                            onChange={(e) => {
                              const newPeriods = [...editingTimePeriods];
                              newPeriods[index].endHour = parseInt(e.target.value);
                              setEditingTimePeriods(newPeriods);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {Array.from({ length: 24 }).map((_, h) => (
                              <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="text-sm font-semibold">:</span>
                          <select
                            value={period.endMinute}
                            onChange={(e) => {
                              const newPeriods = [...editingTimePeriods];
                              newPeriods[index].endMinute = parseInt(e.target.value);
                              setEditingTimePeriods(newPeriods);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {Array.from({ length: 12 }).map((_, m) => {
                              const minute = m * 5;
                              return <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>;
                            })}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => setEditingTimePeriods([...editingTimePeriods, {
                    startHour: 9,
                    startMinute: 0,
                    endHour: 17,
                    endMinute: 0,
                  }])}
                  className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded font-semibold text-sm hover:bg-blue-200"
                >
                  + 診療時間帯追加
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  更新
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditScheduleModal(false);
                    setEditingScheduleId(null);
                    setEditingSchedule(null);
                    setEditingTimePeriods([]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
