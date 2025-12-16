'use client';

import { useState } from 'react';

interface Character {
  name: string;
  itemLevel: string;
  server: string;
  lastUpdated: string;
  url: string;
  history?: Array<{
    itemLevel: string;
    date: string;
  }>;
}

export default function CharacterList({ characters }: { characters: Character[] }) {
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!password || !characterToDelete) return;

    try {
      const response = await fetch('/api/characters', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: characterToDelete, password }),
      });

      if (response.ok) {
        alert('캐릭터가 삭제되었습니다');
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || '삭제 실패');
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다');
    }

    setShowPasswordModal(false);
    setPassword('');
    setCharacterToDelete(null);
  };

  const calculateChange = (character: Character) => {
    if (!character.history || character.history.length < 2) return null;

    const current = parseInt(character.itemLevel);
    const previous = parseInt(character.history[character.history.length - 2].itemLevel);
    const change = current - previous;

    if (change === 0) return null;

    return {
      value: change,
      isPositive: change > 0
    };
  };

  if (characters.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>아직 추적 중인 캐릭터가 없습니다</p>
        <p className="text-sm mt-2">위에서 캐릭터를 추가해보세요</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character) => {
          const change = calculateChange(character);

          return (
            <div
              key={character.name}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{character.name}</h3>
                <button
                  onClick={() => {
                    setCharacterToDelete(character.name);
                    setShowPasswordModal(true);
                  }}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  삭제
                </button>
              </div>

              <div className="text-3xl font-bold text-blue-400 mb-2">
                {parseInt(character.itemLevel).toLocaleString()}
                {change && (
                  <span
                    className={`text-lg ml-2 ${
                      change.isPositive ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {change.isPositive ? '+' : ''}{change.value}
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <p>서버: {character.server}</p>
                <p>
                  업데이트: {new Date(character.lastUpdated).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <a
                href={character.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
              >
                공식 페이지 →
              </a>
            </div>
          );
        })}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">캐릭터 삭제</h3>
            <p className="text-gray-400 mb-4">
              "{characterToDelete}"를 삭제하려면 비밀번호를 입력하세요
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDelete()}
              placeholder="비밀번호"
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                삭제
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setCharacterToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
