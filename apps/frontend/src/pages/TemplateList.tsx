import { useEffect, useState } from 'react';
import { api } from '@/api/client';

type Template = {
  id: number;
  name: string;
  subject: string;
  bodyHtml: string;
};

export default function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Partial<Template>>({});

  const load = async () => {
    const r = await api.get('/templates');
    setTemplates(r.data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (editing.id) {
      await api.put(`/templates/${editing.id}`, editing);
    } else {
      await api.post('/templates', editing);
    }
    setEditing({});
    load();
  };

  const del = async (id: number) => {
    if (window.confirm('削除しますか？')) {
      await api.delete(`/templates/${id}`);
      load();
    }
  };

  return (
    <div>
      <h2 className="text-2xl mb-4">メールテンプレート管理</h2>

      {/* List */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">名前</th>
            <th className="p-2 text-left">件名</th>
            <th className="p-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {templates.map(t => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.name}</td>
              <td className="p-2">{t.subject}</td>
              <td className="p-2 space-x-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => setEditing(t)}
                >
                  編集
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => del(t.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit / Create Form */}
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h3 className="font-semibold mb-2">{editing.id ? '編集' : '新規作成'}</h3>
        <label className="block mb-2">
          名前:
          <input
            type="text"
            value={editing.name ?? ''}
            onChange={e => setEditing({ ...editing, name: e.target.value })}
            className="border rounded w-full"
          />
        </label>
        <label className="block mb-2">
          件名:
          <input
            type="text"
            value={editing.subject ?? ''}
            onChange={e => setEditing({ ...editing, subject: e.target.value })}
            className="border rounded w-full"
          />
        </label>
        <label className="block mb-2">
          本文 (HTML):
          <textarea
            rows={6}
            value={editing.bodyHtml ?? ''}
            onChange={e => setEditing({ ...editing, bodyHtml: e.target.value })}
            className="border rounded w-full"
          />
        </label>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={save}
        >
          保存
        </button>
      </div>
    </div>
  );
}
