import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useSystemConfigStore } from '@/shared/stores/systemConfigStore';

interface Doctor {
  id: number;
  name: string;
  email: string;
  azureObjectId: string;
  honorific?: string;
  defaultDurationMinutes?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
}

interface DoctorManagementSettingsProps {
  doctors: Doctor[];
  onDoctorAdded: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  systemDefaultDuration?: number | string;
}

interface AccordionSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

interface ValidationError {
  field: string;
  message: string;
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

export default function DoctorManagementSettings({
  doctors,
  onDoctorAdded,
  isExpanded,
  onToggle,
  systemDefaultDuration = 30,
}: DoctorManagementSettingsProps) {
  const { config } = useSystemConfigStore();

  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessages, setErrorMessages] = useState<ValidationError[]>([]);

  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorHonorific, setNewDoctorHonorific] = useState<string>('医師');
  const [newDoctorMinDuration, setNewDoctorMinDuration] = useState<string>('5');
  const [newDoctorDefaultDuration, setNewDoctorDefaultDuration] = useState<string>('30');
  const [newDoctorMaxDuration, setNewDoctorMaxDuration] = useState<string>('300');

  const [editingDoctorId, setEditingDoctorId] = useState<number | null>(null);
  const [editingDoctorName, setEditingDoctorName] = useState('');
  const [editingDoctorHonorific, setEditingDoctorHonorific] = useState<string>('医師');
  const [editingDoctorMinDuration, setEditingDoctorMinDuration] = useState<string>('5');
  const [editingDoctorDefaultDuration, setEditingDoctorDefaultDuration] = useState<string>('30');
  const [editingDoctorMaxDuration, setEditingDoctorMaxDuration] = useState<string>('300');

  // Initialize from systemConfigStore
  useEffect(() => {
    const minDuration = (config.doctorTiming.minDurationMinutes || 5).toString();
    const defaultDuration = (config.doctorTiming.defaultDurationMinutes || 30).toString();
    const maxDuration = (config.doctorTiming.maxDurationMinutes || 300).toString();
    const honorific = config.doctorTiming.honorific || '医師';

    setNewDoctorMinDuration(minDuration);
    setNewDoctorDefaultDuration(defaultDuration);
    setNewDoctorMaxDuration(maxDuration);
    setNewDoctorHonorific(honorific);
    setEditingDoctorMinDuration(minDuration);
    setEditingDoctorDefaultDuration(defaultDuration);
    setEditingDoctorMaxDuration(maxDuration);
    setEditingDoctorHonorific(honorific);
  }, [config.doctorTiming]);

  const validateDurations = (
    minDuration: any,
    defaultDuration: any,
    maxDuration: any
  ): boolean => {
    const errors: ValidationError[] = [];

    // Check if they are valid numbers
    const minNum = parseInt(minDuration);
    const defaultNum = parseInt(defaultDuration);
    const maxNum = parseInt(maxDuration);

    if (isNaN(minNum)) {
      errors.push({ field: '最小診療時間', message: '数値を入力してください' });
    }
    if (isNaN(defaultNum)) {
      errors.push({ field: 'デフォルト診療時間', message: '数値を入力してください' });
    }
    if (isNaN(maxNum)) {
      errors.push({ field: '最大診療時間', message: '数値を入力してください' });
    }

    // If no NaN errors, check the logic
    if (!isNaN(minNum) && !isNaN(defaultNum) && !isNaN(maxNum)) {
      if (minNum < 1) {
        errors.push({ field: '最小診療時間', message: '1以上の値を入力してください' });
      }
      if (defaultNum < 1) {
        errors.push({ field: 'デフォルト診療時間', message: '1以上の値を入力してください' });
      }
      if (maxNum < 1) {
        errors.push({ field: '最大診療時間', message: '1以上の値を入力してください' });
      }
      if (minNum <= maxNum && defaultNum < minNum) {
        errors.push({ field: 'デフォルト診療時間', message: '最小診療時間以上である必要があります' });
      }
      if (defaultNum > maxNum) {
        errors.push({ field: 'デフォルト診療時間', message: '最大診療時間以下である必要があります' });
      }
    }

    if (errors.length > 0) {
      setErrorMessages(errors);
      setShowErrorModal(true);
      return false;
    }
    return true;
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDoctorName.trim()) {
      setErrorMessages([{ field: '医師名', message: '医師名を入力してください' }]);
      setShowErrorModal(true);
      return;
    }

    if (!validateDurations(newDoctorMinDuration, newDoctorDefaultDuration, newDoctorMaxDuration)) {
      return;
    }

    try {
      await api.post('/doctors', {
        name: newDoctorName,
        honorific: newDoctorHonorific,
        minDurationMinutes: parseInt(newDoctorMinDuration.toString()),
        defaultDurationMinutes: parseInt(newDoctorDefaultDuration.toString()),
        maxDurationMinutes: parseInt(newDoctorMaxDuration.toString()),
      });

      setShowAddDoctorModal(false);
      setNewDoctorName('');
      setNewDoctorHonorific(config.doctorTiming.honorific || '医師');
      setNewDoctorMinDuration((config.doctorTiming.minDurationMinutes || 5).toString());
      setNewDoctorDefaultDuration((config.doctorTiming.defaultDurationMinutes || 30).toString());
      setNewDoctorMaxDuration((config.doctorTiming.maxDurationMinutes || 300).toString());
      onDoctorAdded();
    } catch (err) {
      console.error('Error adding doctor:', err);
    }
  };

  const handleEditDoctor = (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setEditingDoctorId(doctorId);
      setEditingDoctorName(doctor.name);
      setEditingDoctorHonorific(doctor.honorific || '医師');
      setEditingDoctorMinDuration((doctor.minDurationMinutes || 5).toString());
      setEditingDoctorDefaultDuration((doctor.defaultDurationMinutes || 30).toString());
      setEditingDoctorMaxDuration((doctor.maxDurationMinutes || 300).toString());
      setShowEditDoctorModal(true);
    }
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDoctorName.trim() || editingDoctorId === null) {
      setErrorMessages([{ field: '医師名', message: '医師名を入力してください' }]);
      setShowErrorModal(true);
      return;
    }

    if (!validateDurations(editingDoctorMinDuration, editingDoctorDefaultDuration, editingDoctorMaxDuration)) {
      return;
    }

    try {
      await api.put(`/doctors/${editingDoctorId}`, {
        name: editingDoctorName,
        honorific: editingDoctorHonorific,
        minDurationMinutes: parseInt(editingDoctorMinDuration.toString()),
        defaultDurationMinutes: parseInt(editingDoctorDefaultDuration.toString()),
        maxDurationMinutes: parseInt(editingDoctorMaxDuration.toString()),
      });

      setShowEditDoctorModal(false);
      setEditingDoctorId(null);
      setEditingDoctorName('');
      setEditingDoctorHonorific('医師');
      setEditingDoctorMinDuration('5');
      setEditingDoctorDefaultDuration('30');
      setEditingDoctorMaxDuration('300');
      onDoctorAdded();
    } catch (err) {
      console.error('Error updating doctor:', err);
    }
  };

  const handleDeleteDoctor = async (doctorId: number, doctorName: string) => {
    if (!window.confirm(`${doctorName}医師を削除しますか？`)) {
      return;
    }

    try {
      await api.delete(`/doctors/${doctorId}`);
      onDoctorAdded();
    } catch (err) {
      console.error('Error deleting doctor:', err);
    }
  };

  return (
    <>
      <AccordionSection
        title="医師の登録・編集・削除"
        isExpanded={isExpanded}
        onToggle={onToggle}
      >
        <p className="text-gray-600">医師を登録・編集・削除できます。</p>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3">登録済みの医師</h4>
          {doctors.length === 0 ? (
            <p className="text-gray-600 text-sm">登録されている医師はいません。</p>
          ) : (
            <div className="space-y-2">
              {doctors.map(doctor => (
                <div key={doctor.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {doctor.name} {doctor.honorific || '医師'}（{doctor.minDurationMinutes || 5}～{doctor.defaultDurationMinutes || 30}～{doctor.maxDurationMinutes || 300}分）
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDoctor(doctor.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <button
            onClick={() => {
              setNewDoctorName('');
              setNewDoctorMinDuration((config.doctorTiming.minDurationMinutes || 5).toString());
              setNewDoctorDefaultDuration((config.doctorTiming.defaultDurationMinutes || 30).toString());
              setNewDoctorMaxDuration((config.doctorTiming.maxDurationMinutes || 300).toString());
              setNewDoctorHonorific(config.doctorTiming.honorific || '医師');
              setShowAddDoctorModal(true);
            }}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
          >
            + 医師の登録
          </button>
        </div>
      </AccordionSection>

      {/* 医師追加モーダル */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">医師の登録</h3>

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">医師名</label>
                <input
                  type="text"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  placeholder="例：山田太郎"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">最小診療時間（分）</label>
                <input
                  type="text"
                  value={newDoctorMinDuration}
                  onChange={(e) => setNewDoctorMinDuration(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">デフォルト診療時間（分）</label>
                <input
                  type="text"
                  value={newDoctorDefaultDuration}
                  onChange={(e) => setNewDoctorDefaultDuration(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">最大診療時間（分）</label>
                <input
                  type="text"
                  value={newDoctorMaxDuration}
                  onChange={(e) => setNewDoctorMaxDuration(e.target.value)}
                  placeholder="300"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">敬称</label>
                <input
                  type="text"
                  value={newDoctorHonorific}
                  onChange={(e) => setNewDoctorHonorific(e.target.value)}
                  placeholder="例：医師"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  登録
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 医師編集モーダル */}
      {showEditDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">医師の編集</h3>

            <form onSubmit={handleUpdateDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">医師名</label>
                <input
                  type="text"
                  value={editingDoctorName}
                  onChange={(e) => setEditingDoctorName(e.target.value)}
                  placeholder="例：山田太郎"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">最小診療時間（分）</label>
                <input
                  type="text"
                  value={editingDoctorMinDuration}
                  onChange={(e) => setEditingDoctorMinDuration(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">デフォルト診療時間（分）</label>
                <input
                  type="text"
                  value={editingDoctorDefaultDuration}
                  onChange={(e) => setEditingDoctorDefaultDuration(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">最大診療時間（分）</label>
                <input
                  type="text"
                  value={editingDoctorMaxDuration}
                  onChange={(e) => setEditingDoctorMaxDuration(e.target.value)}
                  placeholder="300"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">敬称</label>
                <input
                  type="text"
                  value={editingDoctorHonorific}
                  onChange={(e) => setEditingDoctorHonorific(e.target.value)}
                  placeholder="例：医師"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  onClick={() => setShowEditDoctorModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* エラーダイアログ */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-red-600">エラー</h3>
            <div className="space-y-2 mb-6">
              {errorMessages.map((error, index) => (
                <p key={index} className="text-gray-700">
                  <span className="font-semibold">{error.field}：</span> {error.message}
                </p>
              ))}
            </div>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
