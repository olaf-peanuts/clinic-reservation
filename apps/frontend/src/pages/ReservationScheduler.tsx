import { useState, useEffect } from 'react';
import { api } from '@/api/client';

type Doctor = { id: number; name: string; honorific?: string };
type Employee = { id: number; name: string; employeeId: string };

export default function ReservationScheduler() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [duration, setDuration] = useState(15);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [chosenSlot, setChosenSlot] = useState<string>('');

  // Load doctors & employees
  useEffect(() => {
    api.get('/doctors').then(r => setDoctors(r.data));
    api.get('/employees').then(r => setEmployees(r.data));
  }, []);

  // 候補取得
  const fetchCandidates = async () => {
    if (!selectedDoctor || !selectedEmployee) return;
    const res = await api.get('/reservations/candidates', {
      params: {
        doctorId: selectedDoctor,
        employeeId: selectedEmployee,
        durationMinutes: duration,
      },
    });
    setCandidates(res.data);
  };

  // 予約作成
  const createReservation = async () => {
    if (!chosenSlot) return;
    await api.post('/reservations', {
      doctorId: selectedDoctor,
      employeeId: selectedEmployee,
      startAt: chosenSlot,
      durationMinutes: duration,
    });
    alert('予約が完了しました');
    setCandidates([]);
    setChosenSlot('');
  };

  // テンプレート取得 & メールプレビュー
  const [template, setTemplate] = useState<any>(null);
  const loadTemplate = async () => {
    const r = await api.get('/templates?name=診療案内');
    setTemplate(r.data[0]);
  };
  useEffect(() => {
    if (chosenSlot) loadTemplate();
  }, [chosenSlot]);

  return (
    <div>
      <h2 className="text-2xl mb-4">予約スケジューラ</h2>

      {/* 医師選択 */}
      <label className="block mb-2">
        医師:
        <select
          className="border rounded ml-2"
          onChange={e => setSelectedDoctor(Number(e.target.value))}
        >
          <option value="">--選択--</option>
          {doctors.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} {d.honorific || '医師'}
            </option>
          ))}
        </select>
      </label>

      {/* 社員選択 */}
      <label className="block mb-2">
        社員:
        <select
          className="border rounded ml-2"
          onChange={e => setSelectedEmployee(Number(e.target.value))}
        >
          <option value="">--選択--</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.employeeId})
            </option>
          ))}
        </select>
      </label>

      {/* 診療時間 */}
      <label className="block mb-2">
        診療時間（分）:
        <input
          type="number"
          min={5}
          step={5}
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="border rounded ml-2 w-20"
        />
      </label>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={fetchCandidates}
        disabled={!selectedDoctor || !selectedEmployee}
      >
        候補日時取得
      </button>

      {/* 候補一覧 */}
      {candidates.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">候補日時（5分刻み）</h3>
          <ul className="list-disc pl-5">
            {candidates.map((c, i) => (
              <li key={i}>
                <button
                  className={`${
                    chosenSlot === c ? 'bg-green-200' : ''
                  } hover:bg-gray-100 px-2 py-1`}
                  onClick={() => setChosenSlot(c)}
                >
                  {new Date(c).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* メールプレビュー */}
      {chosenSlot && template && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-2">メールプレビュー</h3>
          <p><strong>件名:</strong> {template.subject.replace('{{doctorName}}', `${doctors.find(d => d.id === selectedDoctor)?.name} ${doctors.find(d => d.id === selectedDoctor)?.honorific || '医師'}`)}</p>
          <div
            dangerouslySetInnerHTML={{
              __html: template.bodyHtml
                .replace('{{employeeName}}', employees.find(e => e.id === selectedEmployee)?.name ?? '')
                .replace('{{doctorName}}', `${doctors.find(d => d.id === selectedDoctor)?.name ?? ''} ${doctors.find(d => d.id === selectedDoctor)?.honorific || '医師'}`)
                .replace(
                  '{{reservationDate}}',
                  new Date(chosenSlot).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                ),
            }}
          />
        </div>
      )}

      {/* 予約確定ボタン */}
      {chosenSlot && (
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          onClick={createReservation}
        >
          予約を確定してメール送信
        </button>
      )}
    </div>
  );
}
