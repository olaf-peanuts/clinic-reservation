import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, systemConfigApi } from '@/api/client';
import TodayScheduleCalendar from '@/components/TodayScheduleCalendar';
import SystemConfigPanel from '@/components/SystemConfigPanel';
import ScheduleManagement from '@/components/ScheduleManagement';
import DoctorManagementSettings from '@/components/DoctorManagementSettings';
import ValidationErrorModal from '@/components/ValidationErrorModal';
import Toast from '@/components/Toast';

interface Doctor {
  id: number;
  name: string;
  email: string;
  azureObjectId: string;
  defaultDurationMinutes?: number;
}

interface Template {
  id: number;
  name: string;
  subject: string;
  bodyHtml: string;
}

interface Employee {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  department?: string;
}

interface TimePeriod {
  startTime: string;
  endTime: string;
}

interface AccordionSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month' | 'doctors' | 'reservations' | 'settings' | 'system-config'>('day');
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReminderExpanded, setIsReminderExpanded] = useState(false);
  const [isDoctorExpanded, setIsDoctorExpanded] = useState(false);
  const [isCalendarSettingsExpanded, setIsCalendarSettingsExpanded] = useState(false);
  const [isExaminationRoomsExpanded, setIsExaminationRoomsExpanded] = useState(false);
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);
  const [displayDaysOfWeek, setDisplayDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [systemDefaultDuration, setSystemDefaultDuration] = useState<number | string>(30);
  const [numberOfRooms, setNumberOfRooms] = useState<number>(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [clinicHours, setClinicHours] = useState<Array<{ dayOfWeek: number; startTime: string; endTime: string }>>([
    { dayOfWeek: 0, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 6, startTime: '09:00', endTime: '18:00' },
  ]);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    bodyHtml: '',
  });
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState({
    name: '',
    subject: '',
    bodyHtml: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 社員呼び出し関連の状態
  const [employeeSearchId, setEmployeeSearchId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>(String(systemDefaultDuration));
  const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);
  const [employeeSearchError, setEmployeeSearchError] = useState<string | null>(null);

  // データ取得
  useEffect(() => {
    console.log('Dashboard: useEffect starting');
    const fetchData = async () => {
      try {
        console.log('Dashboard: fetchData starting');
        setLoading(true);
        setError(null);
        
        const [doctorRes, templateRes, employeeRes, scheduleRes, configRes] = await Promise.all([
          api.get('/doctors').catch(() => ({ data: [] })),
          api.get('/templates').catch(() => ({ data: [] })),
          api.get('/employees').catch(() => ({ data: [] })),
          api.get('/doctor-schedules').catch(() => ({ data: [] })),
          api.get('/api/config/doctor-default-duration').catch(() => ({ data: { defaultDurationMinutes: 30 } })),
        ]);

        setDoctors(doctorRes.data || []);
        setTemplates(templateRes.data || []);
        setEmployees(employeeRes.data || []);
        setSchedules(scheduleRes.data || []);
        setSystemDefaultDuration(configRes.data?.defaultDurationMinutes || 30);
        
        // 他の設定をロード
        await loadCalendarSettings();
        await loadExaminationRooms();
      } catch (err) {
        setError((err as Error).message);
        console.error('API error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // スケジュール追加処理
  const handleScheduleAdded = async () => {
    try {
      const scheduleRes = await api.get('/doctor-schedules').catch(() => ({ data: [] }));
      setSchedules(scheduleRes.data || []);
      const doctorRes = await api.get('/doctors').catch(() => ({ data: [] }));
      setDoctors(doctorRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // 医師追加処理
  const handleDoctorAdded = async () => {
    try {
      const doctorRes = await api.get('/doctors').catch(() => ({ data: [] }));
      setDoctors(doctorRes.data || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  // カレンダー設定読み込み
  const loadCalendarSettings = async () => {
    try {
      const res = await api.get('/config/calendar-settings').catch(() => ({ data: null }));
      if (res.data?.displayDaysOfWeek) {
        setDisplayDaysOfWeek(res.data.displayDaysOfWeek);
      }
      if (res.data?.clinicHours) {
        setClinicHours(res.data.clinicHours);
      }
    } catch (err) {
      console.error('Error loading calendar settings:', err);
    }
  };

  // カレンダー設定保存
  const handleSaveCalendarSettings = async () => {
    try {
      await api.put('/config/calendar-settings', { displayDaysOfWeek, clinicHours });
      setToast({ message: '診療カレンダー&診療時間帯設定を保存しました', type: 'success' });
    } catch (err) {
      console.error('Error saving calendar settings:', err);
      setToast({ message: '診療カレンダー&診療時間帯設定の保存に失敗しました', type: 'error' });
    }
  };

  // 診療時間の更新
  const updateClinicHour = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setClinicHours(prevHours =>
      prevHours.map(hour =>
        hour.dayOfWeek === dayOfWeek ? { ...hour, [field]: value } : hour
      )
    );
  };

  // 社員番号で社員情報を検索
  const handleSearchEmployee = async () => {
    if (!employeeSearchId.trim()) {
      setEmployeeSearchError('社員番号を入力してください');
      return;
    }

    try {
      setEmployeeSearchLoading(true);
      setEmployeeSearchError(null);
      
      // AzureAD（Mock）から社員情報を取得
      const response = await api.get(`/employees/${employeeSearchId}`);
      const employeeData = response.data?.data || response.data;
      
      setSelectedEmployee({
        id: employeeData.id || 0,
        employeeId: employeeData.employeeNumber || employeeData.employeeId,
        name: employeeData.name,
        email: employeeData.email,
        department: employeeData.department,
      });
      setSelectedDoctor(null);
      setSelectedDuration(String(systemDefaultDuration));
    } catch (err) {
      setEmployeeSearchError((err as any).response?.data?.message || '社員が見つかりません');
      setSelectedEmployee(null);
    } finally {
      setEmployeeSearchLoading(false);
    }
  };

  // 診察室の部屋数読み込み
  const loadExaminationRooms = async () => {
    try {
      const res = await systemConfigApi.getExaminationRooms();
      setNumberOfRooms(res.data?.numberOfRooms || 1);
    } catch (err) {
      console.error('Error loading examination rooms:', err);
    }
  };

  // 診察室の部屋数保存
  const handleSaveExaminationRooms = async () => {
    try {
      if (numberOfRooms < 1) {
        setToast({ message: '診察室の部屋数は1以上である必要があります', type: 'error' });
        return;
      }
      await systemConfigApi.updateExaminationRooms(numberOfRooms);
      setToast({ message: '診察室の部屋数を保存しました', type: 'success' });
    } catch (err) {
      console.error('Error saving examination rooms:', err);
      setToast({ message: '診察室の部屋数の保存に失敗しました', type: 'error' });
    }
  };

  // 曜日チェックボックスの切り替え
  const toggleDayOfWeek = (dayOfWeek: number) => {
    if (displayDaysOfWeek.includes(dayOfWeek)) {
      setDisplayDaysOfWeek(displayDaysOfWeek.filter(d => d !== dayOfWeek));
    } else {
      setDisplayDaysOfWeek([...displayDaysOfWeek, dayOfWeek].sort());
    }
  };

  // テンプレート追加処理
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTemplate.name.trim()) {
      alert('テンプレート名を入力してください');
      return;
    }
    
    if (!newTemplate.subject.trim()) {
      alert('メール件名を入力してください');
      return;
    }
    
    if (!newTemplate.bodyHtml.trim()) {
      alert('メール本文を入力してください');
      return;
    }

    try {
      setLoading(true);
      console.log('Sending template data:', newTemplate);
      const response = await api.post('/templates', newTemplate);
      console.log('Template created successfully:', response);
      
      setShowAddTemplateModal(false);
      setNewTemplate({ name: '', subject: '', bodyHtml: '' });
      
      // テンプレート一覧を再取得
      const templateRes = await api.get('/templates').catch(() => ({ data: [] }));
      setTemplates(templateRes.data || []);
    } catch (err: any) {
      console.error('Error adding template:', err);
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // テンプレート編集処理
  const handleEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTemplate.name.trim()) {
      alert('テンプレート名を入力してください');
      return;
    }

    if (!editingTemplate.subject.trim()) {
      alert('メール件名を入力してください');
      return;
    }

    if (!editingTemplate.bodyHtml.trim()) {
      alert('メール本文を入力してください');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/templates/${editingTemplateId}`, editingTemplate);

      setShowEditTemplateModal(false);
      setEditingTemplateId(null);
      setEditingTemplate({ name: '', subject: '', bodyHtml: '' });

      // テンプレート一覧を再取得
      const templateRes = await api.get('/templates').catch(() => ({ data: [] }));
      setTemplates(templateRes.data || []);
    } catch (err: any) {
      console.error('Error updating template:', err);
    } finally {
      setLoading(false);
    }
  };

  // テンプレート削除処理
  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/templates/${templateId}`);

      // テンプレート一覧を再取得
      const templateRes = await api.get('/templates').catch(() => ({ data: [] }));
      setTemplates(templateRes.data || []);
    } catch (err: any) {
      console.error('Error deleting template:', err);
    } finally {
      setLoading(false);
    }
  };

  // テンプレート編集モーダルを開く
  const openEditModal = (template: Template) => {
    setEditingTemplateId(template.id);
    setEditingTemplate({
      name: template.name,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
    });
    setShowEditTemplateModal(true);
  };

  // 初回ロード時にカレンダー設定を読み込む
  useEffect(() => {
    loadCalendarSettings();
    loadExaminationRooms();
  }, []);

  // AccordionSectionコンポーネント（テンプレートのみで使用）
  interface AccordionSectionProps {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }

  const AccordionSection: React.FC<AccordionSectionProps> = ({
    title,
    isExpanded,
    onToggle,
    children,
  }) => (
    <div className="border rounded-lg overflow-hidden mt-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="text-2xl text-gray-600 font-bold">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      {isExpanded && <div className="px-6 py-6 space-y-6 bg-white">{children}</div>}
    </div>
  );

  return (
    <div className="w-full h-full bg-gray-50 flex">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 左側のタブナビゲーション - フローティング */}
      <div className="fixed left-3 top-20 w-48 bg-white shadow-lg border-r border-gray-200 h-auto max-h-[calc(100vh-100px)] overflow-y-auto z-10 mr-3">
        <nav className="px-0 py-4 space-y-0">
          <button
            onClick={() => setActiveTab('day')}
            className={`w-full text-left px-6 py-3 font-semibold text-sm border-l-4 transition-colors ${
              activeTab === 'day'
                ? 'text-green-600 border-green-600 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-gray-50'
            }`}
          >
            本日の予定
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`w-full text-left px-6 py-3 font-semibold text-sm border-l-4 transition-colors ${
              activeTab === 'week'
                ? 'text-green-600 border-green-600 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-gray-50'
            }`}
          >
            今週の予定
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`w-full text-left px-6 py-3 font-semibold text-sm border-l-4 transition-colors ${
              activeTab === 'month'
                ? 'text-green-600 border-green-600 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-gray-50'
            }`}
          >
            今月の予定
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`w-full text-left px-6 py-3 font-semibold text-sm border-l-4 transition-colors ${
              activeTab === 'doctors'
                ? 'text-green-600 border-green-600 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-gray-50'
            }`}
          >
            医師のスケジュール
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`w-full text-left px-6 py-3 font-semibold text-sm border-l-4 transition-colors ${
              activeTab === 'reservations'
                ? 'text-green-600 border-green-600 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-gray-50'
            }`}
          >
            社員呼び出し
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-6 py-3 font-semibold text-sm border-l-4 transition-colors ${
              activeTab === 'settings'
                ? 'text-green-600 border-green-600 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-gray-50'
            }`}
          >
            設定
          </button>
          <button
            onClick={() => setActiveTab('system-config')}
            className={`w-full text-left px-6 py-3 font-semibold text-sm border-l-4 transition-colors ${
              activeTab === 'system-config'
                ? 'text-green-600 border-green-600 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-gray-50'
            }`}
          >
            システム設定
          </button>
        </nav>
      </div>

      {/* 右側のコンテンツエリア */}
      <div className="flex-1 ml-48 px-3 py-6 flex flex-col overflow-hidden">
        {(() => {
          console.log('Dashboard rendering, activeTab:', activeTab);
          return null;
        })()}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            <p><strong>エラー:</strong> {error}</p>
          </div>
        )}

      {/* 日単位の診療予定 */}
      {activeTab === 'day' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <TodayScheduleCalendar 
            viewMode="day" 
            initialDate={scheduleDate}
            onDateChange={setScheduleDate}
            numberOfRooms={numberOfRooms}
          />
        </div>
      )}

      {/* 週単位の診療予定 */}
      {activeTab === 'week' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <TodayScheduleCalendar 
            viewMode="week" 
            initialDate={scheduleDate}
            onDateChange={setScheduleDate}
            numberOfRooms={numberOfRooms}
          />
        </div>
      )}

      {/* 月単位の診療予定 */}
      {activeTab === 'month' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <TodayScheduleCalendar 
            viewMode="month" 
            initialDate={scheduleDate}
            onDateChange={setScheduleDate}
            numberOfRooms={numberOfRooms}
          />
        </div>
      )}

      {/* 医師のスケジュール管理 */}
      {activeTab === 'doctors' && (
        <ScheduleManagement
          doctors={doctors}
          schedules={schedules}
          displayDaysOfWeek={displayDaysOfWeek}
          currentMonth={currentMonth}
          onScheduleAdded={handleScheduleAdded}
          onMonthChange={setCurrentMonth}
          loading={loading}
          error={error}
          numberOfRooms={numberOfRooms}
        />
      )}

      {/* 社員呼び出し */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">社員呼び出し</h2>
          <p className="text-gray-600 mb-6">健康状態が悪い社員をピックアップしてメールを送信します。</p>

          {/* ステップ1: 社員検索 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">ステップ1: 社員検索</h3>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">社員番号</label>
                <input
                  type="text"
                  value={employeeSearchId}
                  onChange={(e) => setEmployeeSearchId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchEmployee()}
                  placeholder="例：10012345"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearchEmployee}
                  disabled={employeeSearchLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {employeeSearchLoading ? '検索中...' : '検索'}
                </button>
              </div>
            </div>

            {employeeSearchError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                {employeeSearchError}
              </div>
            )}

            {selectedEmployee && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm mb-2"><strong>氏名：</strong> {selectedEmployee.name}</p>
                <p className="text-sm mb-2"><strong>所属会社：</strong> {selectedEmployee.email?.split('@')[0] || '情報なし'}</p>
                <p className="text-sm"><strong>所属部署：</strong> {selectedEmployee.department || '情報なし'}</p>
              </div>
            )}
          </div>

          {/* ステップ2: 医師・診療時間指定 */}
          {selectedEmployee && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">ステップ2: 医師・診療時間指定</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">担当医師</label>
                  <select 
                    value={selectedDoctor || ''}
                    onChange={(e) => setSelectedDoctor(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">医師を選択してください</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">診療時間（分）</label>
                  <input
                    type="number"
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    min="5"
                    step="5"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex items-end">
                  <button 
                    disabled={!selectedDoctor}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                  >
                    候補日時を検索
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ステップ3: 予定確認・メール送信 */}
          {selectedEmployee && selectedDoctor && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">利用可能な診療日時（候補）</h3>
              <div className="space-y-2">
                <label className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                  <input type="radio" name="appointment" className="mr-3" />
                  <span className="text-gray-700">2025年12月10日 09:30 - 10:00</span>
                </label>
                <label className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                  <input type="radio" name="appointment" className="mr-3" />
                  <span className="text-gray-700">2025年12月10日 11:00 - 11:30</span>
                </label>
                <label className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                  <input type="radio" name="appointment" className="mr-3" />
                  <span className="text-gray-700">2025年12月11日 14:00 - 14:30</span>
                </label>
              </div>
            </div>
          )}

          {selectedEmployee && selectedDoctor && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <label className="block font-semibold text-gray-700 mb-3">メールテンプレートを選択</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>テンプレートを選択してください</option>
                  {templates.map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white border-l-4 border-blue-500 p-4 mb-6">
                <h3 className="font-semibold mb-2">メール送信内容（プレビュー）</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>宛先：</strong> {selectedEmployee.email}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  <strong>件名：</strong> メールテンプレートの件名がここに表示されます
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 border">
                  <p>【プレビュー】</p>
                  <p className="mt-2">
                    メールテンプレートの本文がここに表示されます。社員名と診療日時が自動で入力されます。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold">
                  メール送信
                </button>
                <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">
                  キャンセル
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 設定 */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">設定</h2>

          {/* 医師の登録・編集・削除 */}
          <DoctorManagementSettings
            doctors={doctors}
            onDoctorAdded={handleDoctorAdded}
            isExpanded={isDoctorExpanded}
            onToggle={() => setIsDoctorExpanded(!isDoctorExpanded)}
            systemDefaultDuration={systemDefaultDuration}
          />

          {/* 診療カレンダー&診療時間帯設定 */}
          <AccordionSection
            title="診療カレンダー&診療時間帯設定"
            isExpanded={isCalendarSettingsExpanded}
            onToggle={() => setIsCalendarSettingsExpanded(!isCalendarSettingsExpanded)}
          >
            <p className="text-gray-600 mb-6">カレンダーに表示する曜日と、各曜日の診療時間を設定してください。</p>

            <div className="space-y-3 mb-6">
              {[
                { value: 0, label: '日' },
                { value: 1, label: '月' },
                { value: 2, label: '火' },
                { value: 3, label: '水' },
                { value: 4, label: '木' },
                { value: 5, label: '金' },
                { value: 6, label: '土' },
              ].map(day => (
                <div key={day.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-2 min-w-fit">
                    <input
                      type="checkbox"
                      checked={displayDaysOfWeek.includes(day.value)}
                      onChange={() => toggleDayOfWeek(day.value)}
                      className="w-5 h-5 text-green-600"
                    />
                    <span className="text-gray-700 font-semibold">{day.label}曜日</span>
                  </label>

                  {displayDaysOfWeek.includes(day.value) && (
                    <div className="flex gap-3 flex-1">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">診療開始時刻</label>
                        <input
                          type="time"
                          value={clinicHours.find(h => h.dayOfWeek === day.value)?.startTime || '09:00'}
                          onChange={(e) => updateClinicHour(day.value, 'startTime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">診療終了時刻</label>
                        <input
                          type="time"
                          value={clinicHours.find(h => h.dayOfWeek === day.value)?.endTime || '18:00'}
                          onChange={(e) => updateClinicHour(day.value, 'endTime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveCalendarSettings}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                設定を保存
              </button>
            </div>
          </AccordionSection>

          {/* 診察室の部屋数の設定 */}
          <AccordionSection
            title="診察室の部屋数の設定"
            isExpanded={isExaminationRoomsExpanded}
            onToggle={() => setIsExaminationRoomsExpanded(!isExaminationRoomsExpanded)}
          >
            <p className="text-gray-600 mb-4">診察室の部屋数を入力してください（1以上の整数）。</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">診察室の部屋数</label>
                <input
                  type="number"
                  min="1"
                  value={numberOfRooms}
                  onChange={(e) => setNumberOfRooms(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveExaminationRooms}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                設定を保存
              </button>
            </div>
          </AccordionSection>

          {/* メールテンプレート管理 */}
          <AccordionSection
            title="メールテンプレートの登録・編集・削除"
            isExpanded={isTemplateExpanded}
            onToggle={() => setIsTemplateExpanded(!isTemplateExpanded)}
          >
            <p className="text-gray-600">社員呼び出しメールのテンプレートを登録・編集・削除できます。</p>

            {!loading && templates.length === 0 && (
              <p className="text-gray-600 mb-6">テンプレートが登録されていません。</p>
            )}

            <div className="space-y-4">
              {templates.map(template => (
                <div key={template.id} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-lg">{template.name}</h4>
                  <p className="text-gray-600 text-sm mt-2">件名：{template.subject}</p>
                  <p className="text-gray-600 text-sm mt-1">本文：{template.bodyHtml.substring(0, 80)}...</p>
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => openEditModal(template)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                      編集
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAddTemplateModal(true)}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold">
              + 新規テンプレート作成
            </button>
          </AccordionSection>

          {/* リマインドメール設定 */}
          <AccordionSection
            title="リマインドメール設定"
            isExpanded={isReminderExpanded}
            onToggle={() => setIsReminderExpanded(!isReminderExpanded)}
          >
            <p className="text-gray-600">リマインドメールの送信タイミングを設定します。</p>

            <div className="border-b pb-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-lg font-semibold text-gray-700">リマインドメール機能を有効にする</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                診療予定日の何日前に送信するか
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  defaultValue="1"
                  min="0"
                  max="7"
                  className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-600">日前</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                送信時刻を指定する
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue="9"
                  min="0"
                  max="23"
                  className="w-16 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span>:</span>
                <input
                  type="number"
                  defaultValue="0"
                  min="0"
                  max="59"
                  className="w-16 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                例：診療予定日の1日前の09:00にリマインドメールが自動送信されます。
              </p>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                設定を保存
              </button>
              <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold">
                キャンセル
              </button>
            </div>
          </AccordionSection>
        </div>
      )}

      {/* スケジュール追加モーダル */}
      {/* 移動: ScheduleManagementコンポーネントへ */}

      {/* スケジュール編集モーダル */}
      {/* 移動: ScheduleManagementコンポーネントへ */}

      {/* 医師追加モーダル */}
      {/* 移動: DoctorManagementSettingsコンポーネントへ */}

      {/* 医師編集モーダル */}
      {/* 移動: DoctorManagementSettingsコンポーネントへ */}

      {/* テンプレート追加モーダル */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-[90%] h-[90%] p-6 flex flex-col overflow-hidden">
            <h3 className="text-xl font-bold mb-4 text-gray-800">テンプレートの新規作成</h3>
            
            <form onSubmit={handleAddTemplate} className="flex flex-col flex-1 space-y-4 overflow-hidden">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">テンプレート名</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="例：定期検診"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">メール件名</label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="例：診療予定のお知らせ"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-2">メール本文</label>
                <textarea
                  value={newTemplate.bodyHtml}
                  onChange={(e) => setNewTemplate({ ...newTemplate, bodyHtml: e.target.value })}
                  placeholder="本文を入力してください"
                  className="flex-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  作成
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* テンプレート編集モーダル */}
      {showEditTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-[90%] h-[90%] p-6 flex flex-col overflow-hidden">
            <h3 className="text-xl font-bold mb-4 text-gray-800">テンプレートの編集</h3>
            
            <form onSubmit={handleEditTemplate} className="flex flex-col flex-1 space-y-4 overflow-hidden">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">テンプレート名</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="例：定期検診"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">メール件名</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  placeholder="例：診療予定のお知らせ"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-2">メール本文</label>
                <textarea
                  value={editingTemplate.bodyHtml}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyHtml: e.target.value })}
                  placeholder="本文を入力してください"
                  className="flex-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
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
                  onClick={() => setShowEditTemplateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {/* システム設定 */}
        {activeTab === 'system-config' && (
          <SystemConfigPanel />
        )}
      </div>
    </div>
  );
}
