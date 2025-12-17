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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);

  // 아이템 레벨 기준으로 내림차순 정렬
  const sortedCharacters = [...characters].sort((a, b) => {
    const levelA = parseInt(a.itemLevel || '0');
    const levelB = parseInt(b.itemLevel || '0');
    return levelB - levelA;
  });

  const handleDeleteClick = (name: string) => {
    setCharacterToDelete(name);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!characterToDelete) return;

    try {
      const response = await fetch('/api/characters', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: characterToDelete }),
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

    setShowDeleteConfirm(false);
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">순위</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">캐릭터 이름</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">아이템 레벨</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">서버</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">마지막 업데이트</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">액션</th>
            </tr>
          </thead>
          <tbody>
            {sortedCharacters.map((character, index) => {
              const change = calculateChange(character);

              return (
                <tr
                  key={character.name}
                  className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 text-lg font-bold text-blue-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={character.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-blue-400 transition-colors font-medium"
                    >
                      {character.name}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-400">
                        {character.itemLevel ? parseInt(character.itemLevel).toLocaleString() : '-'}
                      </span>
                      {change && (
                        <span
                          className={`text-sm ${
                            change.isPositive ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {change.isPositive ? '+' : ''}{change.value}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {character.server}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {character.lastUpdated
                      ? new Date(character.lastUpdated).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteClick(character.name)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">캐릭터 삭제</h3>
            <p className="text-gray-400 mb-6">
              "{characterToDelete}"를 정말 삭제하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                삭제
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
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
