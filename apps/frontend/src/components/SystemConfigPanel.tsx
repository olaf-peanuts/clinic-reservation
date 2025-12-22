import React, { useState, useEffect } from 'react';
import { useSystemConfigStore } from '@/shared/stores/systemConfigStore';
import ValidationErrorModal from './ValidationErrorModal';
import { getAvailableTimezones } from '@/utils/datetime';
import { api } from '@/api/client';

export default function SystemConfigPanel() {
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ローカルUI状態
  const [currentTimezone, setCurrentTimezone] = useState<string>('Asia/Tokyo');
  const [isTimezoneExpanded, setIsTimezoneExpanded] = useState(false);
  const [isDoctorTimeExpanded, setIsDoctorTimeExpanded] = useState(false);
  const [isScreenSizeExpanded, setIsScreenSizeExpanded] = useState(false);

  // 医師設定のローカル状態
  const [minDurationMinutes, setMinDurationMinutes] = useState<string>('5');
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState<string>('30');
  const [maxDurationMinutes, setMaxDurationMinutes] = useState<string>('300');
  const [honorific, setHonorific] = useState<string>('医師');

  // サイズ設定のローカル状態
  const [minScreenWidth, setMinScreenWidth] = useState<string>('1024');
  const [minScreenHeight, setMinScreenHeight] = useState<string>('768');

  // グローバルストア
  const {
    config,
    fetchAllSettings,
    updateDoctorTimingSettings,
    updateTimezoneSettings,
  } = useSystemConfigStore();

  const timezones = getAvailableTimezones();

  // マウント時に設定を読み込む
  useEffect(() => {
    fetchAllSettings();
    loadScreenSize();
  }, []);

  // スクリーンサイズを読み込む
  const loadScreenSize = async () => {
    try {
      const res = await api.get('/config/screen-size').catch(() => ({ data: null }));
      if (res.data?.minScreenWidth !== undefined) {
        setMinScreenWidth(res.data.minScreenWidth.toString());
        document.documentElement.style.setProperty('--min-screen-width', `${res.data.minScreenWidth}px`);
      }
      if (res.data?.minScreenHeight !== undefined) {
        setMinScreenHeight(res.data.minScreenHeight.toString());
        document.documentElement.style.setProperty('--min-screen-height', `${res.data.minScreenHeight}px`);
      }
    } catch (err) {
      console.error('Error loading screen size:', err);
    }
  };

  // ストアの値が更新されたらUIを同期
  useEffect(() => {
    if (config.timezone) {
      setCurrentTimezone(config.timezone.timezone);
    }
    if (config.doctorTiming) {
      setMinDurationMinutes(config.doctorTiming.minDurationMinutes.toString());
      setDefaultDurationMinutes(config.doctorTiming.defaultDurationMinutes.toString());
      setMaxDurationMinutes(config.doctorTiming.maxDurationMinutes.toString());
      setHonorific(config.doctorTiming.honorific || '医師');
    }
  }, [config]);

  const handleTimezoneChange = async (timezone: string) => {
    setCurrentTimezone(timezone);
    try {
      await updateTimezoneSettings(timezone);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error updating timezone:', err);
      setValidationErrorMessage('タイムゾーン設定の保存に失敗しました。');
      setShowValidationError(true);
    }
  };

  const handleSaveDoctorTimingSettings = async () => {
    const minValue = Number(minDurationMinutes);
    const defaultValue = Number(defaultDurationMinutes);
    const maxValue = Number(maxDurationMinutes);

    // バリデーション
    if (!minDurationMinutes || isNaN(minValue) || minValue < 5) {
      setValidationErrorMessage('最小診療時間は5分以上で入力してください。');
      setShowValidationError(true);
      return;
    }
    if (!defaultDurationMinutes || isNaN(defaultValue) || defaultValue < minValue || defaultValue > maxValue) {
      setValidationErrorMessage('デフォルト診療時間は最小診療時間以上、最大診療時間以下で入力してください。');
      setShowValidationError(true);
      return;
    }
    if (!maxDurationMinutes || isNaN(maxValue) || maxValue > 1440) {
      setValidationErrorMessage('最大診療時間は1440分以下で入力してください。');
      setShowValidationError(true);
      return;
    }
    if (!honorific.trim()) {
      setValidationErrorMessage('敬称を入力してください。');
      setShowValidationError(true);
      return;
    }

    try {
      await updateDoctorTimingSettings({
        minDurationMinutes: minValue,
        defaultDurationMinutes: defaultValue,
        maxDurationMinutes: maxValue,
        honorific: honorific.trim(),
      });
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error updating doctor timing settings:', err);
      setValidationErrorMessage('医師設定の保存に失敗しました。');
      setShowValidationError(true);
    }
  };

  // スクリーンサイズを保存
  const handleSaveScreenSize = async () => {
    const width = parseInt(minScreenWidth) || 1024;
    const height = parseInt(minScreenHeight) || 768;

    if (width < 800) {
      setValidationErrorMessage('幅は800px以上で入力してください。');
      setShowValidationError(true);
      return;
    }
    if (height < 600) {
      setValidationErrorMessage('高さは600px以上で入力してください。');
      setShowValidationError(true);
      return;
    }

    try {
      await api.put('/config/screen-size', { minScreenWidth: width, minScreenHeight: height });
      // 保存後、CSS変数に適用
      document.documentElement.style.setProperty('--min-screen-width', `${width}px`);
      document.documentElement.style.setProperty('--min-screen-height', `${height}px`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error saving screen size:', err);
      setValidationErrorMessage('画面サイズ設定の保存に失敗しました。');
      setShowValidationError(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">システム設定</h2>

        {/* タイムゾーン設定 */}
        <div className="border rounded-lg overflow-hidden mt-6">
          <button
            onClick={() => setIsTimezoneExpanded(!isTimezoneExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-800">タイムゾーン設定</h3>
            <span className="text-2xl text-gray-600 font-bold">
              {isTimezoneExpanded ? '−' : '+'}
            </span>
          </button>
          {isTimezoneExpanded && (
            <div className="px-6 py-6 space-y-6 bg-white">
              <p className="text-sm text-gray-600">
                アプリケーション全体で使用するタイムゾーンを選択します。
              </p>

              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイムゾーン
                </label>
                <select
                  value={currentTimezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  現在の設定: <span className="font-bold text-green-600">{currentTimezone}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 医師設定 */}
        <div className="border rounded-lg overflow-hidden mt-6">
          <button
            onClick={() => setIsDoctorTimeExpanded(!isDoctorTimeExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-800">医師登録時のデフォルト値設定</h3>
            <span className="text-2xl text-gray-600 font-bold">
              {isDoctorTimeExpanded ? '−' : '+'}
            </span>
          </button>
          {isDoctorTimeExpanded && (
            <div className="px-6 py-6 space-y-6 bg-white">
              <p className="text-sm text-gray-600">
                医師の診療時間の最小値、デフォルト値、最大値、および敬称を設定します。
              </p>

              <div className="space-y-4">
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最小診療時間（分）
                  </label>
                  <input
                    type="number"
                    value={minDurationMinutes}
                    onChange={(e) => setMinDurationMinutes(e.target.value)}
                    min="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    デフォルト診療時間（分）
                  </label>
                  <input
                    type="number"
                    value={defaultDurationMinutes}
                    onChange={(e) => setDefaultDurationMinutes(e.target.value)}
                    min="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大診療時間（分）
                  </label>
                  <input
                    type="number"
                    value={maxDurationMinutes}
                    onChange={(e) => setMaxDurationMinutes(e.target.value)}
                    max="1440"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    敬称
                  </label>
                  <input
                    type="text"
                    value={honorific}
                    onChange={(e) => setHonorific(e.target.value)}
                    placeholder="例：医師"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveDoctorTimingSettings}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                保存
              </button>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  最小: <span className="font-bold text-green-600">{config.doctorTiming.minDurationMinutes}分</span>
                  　デフォルト: <span className="font-bold text-green-600">{config.doctorTiming.defaultDurationMinutes}分</span>
                  　最大: <span className="font-bold text-green-600">{config.doctorTiming.maxDurationMinutes}分</span>
                  　敬称: <span className="font-bold text-green-600">{config.doctorTiming.honorific}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* サイズ設定 */}
        <div className="border rounded-lg overflow-hidden mt-6">
          <button
            onClick={() => setIsScreenSizeExpanded(!isScreenSizeExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-800">サイズ設定</h3>
            <span className="text-2xl text-gray-600 font-bold">
              {isScreenSizeExpanded ? '−' : '+'}
            </span>
          </button>
          {isScreenSizeExpanded && (
            <div className="px-6 py-6 space-y-6 bg-white">
              <p className="text-sm text-gray-600">
                システムの最小画面サイズを設定します。
              </p>

              <div className="space-y-4">
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    幅（ピクセル）
                  </label>
                  <input
                    type="number"
                    value={minScreenWidth}
                    onChange={(e) => setMinScreenWidth(e.target.value)}
                    min="800"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    高さ（ピクセル）
                  </label>
                  <input
                    type="number"
                    value={minScreenHeight}
                    onChange={(e) => setMinScreenHeight(e.target.value)}
                    min="600"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveScreenSize}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                保存
              </button>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  幅: <span className="font-bold text-green-600">{minScreenWidth}px</span>
                  　高さ: <span className="font-bold text-green-600">{minScreenHeight}px</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ValidationErrorModal
        isOpen={showValidationError}
        title="システム設定エラー"
        message={validationErrorMessage}
        onClose={() => setShowValidationError(false)}
      />

      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          設定が保存されました
        </div>
      )}
    </>
  );
}
