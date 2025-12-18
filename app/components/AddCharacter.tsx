'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddCharacter() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('캐릭터 이름을 입력하세요');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        alert('캐릭터가 추가되었습니다');
        setName('');
        router.refresh(); // 서버 컴포넌트만 새로고침 (빠름!)
      } else {
        const error = await response.json();
        alert(error.message || '추가 실패');
      }
    } catch (error) {
      alert('추가 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">캐릭터 추가</h2>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="캐릭터 이름"
          className="flex-1 px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '추가 중...' : '추가'}
        </button>
      </form>
      <p className="text-sm text-gray-400 mt-2">
        * 마족 루미엘 서버의 캐릭터만 추가 가능합니다
      </p>
      <p className="text-xs text-gray-500 mt-1">
        * 캐릭터 추가 후 내일 오전 9시 자동 업데이트 시 아이템 레벨이 수집됩니다
      </p>
    </div>
  );
}
