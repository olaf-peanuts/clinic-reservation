import React from 'react';

interface ValidationErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function ValidationErrorModal({
  isOpen,
  title,
  message,
  onClose,
}: ValidationErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        </div>
        {/* メッセージ */}
        <p className="text-gray-700 mb-6">
          {message}
        </p>
        {/* ボタン */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
