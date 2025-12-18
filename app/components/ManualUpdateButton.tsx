'use client';

import { useState } from 'react';

export default function ManualUpdateButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/trigger-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ ' + data.message);

        // 90초 후 자동으로 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 90000);
      } else {
        setMessage('❌ ' + (data.message || '업데이트 실패'));
      }
    } catch (error) {
      setMessage('❌ 네트워크 오류가 발생했습니다');
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleUpdate}
        disabled={isLoading}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white
          transition-all duration-200
          ${isLoading
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            업데이트 중...
          </span>
        ) : (
          '🔄 지금 업데이트'
        )}
      </button>

      {message && (
        <div className={`
          text-sm px-4 py-2 rounded
          ${message.startsWith('✅')
            ? 'bg-green-900/30 text-green-400 border border-green-700'
            : 'bg-red-900/30 text-red-400 border border-red-700'
          }
        `}>
          {message}
        </div>
      )}

      <p className="text-xs text-gray-500 text-center max-w-md">
        GitHub Actions를 통해 모든 캐릭터 정보를 즉시 업데이트합니다.
        <br />
        업데이트는 1-2분 정도 소요됩니다.
      </p>
    </div>
  );
}
