'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// 상수 정의
const HISTORY_CONSTANTS = {
  HOURS_PER_DAY: 24,           // 하루 시간
  TIME_TOLERANCE_HOURS: 4,     // 히스토리 검색 시간 범위 허용 오차 (±4시간)
  DAYS_YESTERDAY: 1,           // 전날
  DAYS_WEEK_AGO: 7             // 1주일 전
};

interface Character {
  name: string;
  itemLevel: string;
  characterClass: string;
  server: string;
  lastUpdated: string;
  url: string;
  dpsScore: string;
  history?: Array<{
    itemLevel: string;
    dpsScore: string;
    date: string;
  }>;
}

interface HistoryChange {
  value: number;           // 변화량 (예: 50, -20)
  isPositive: boolean;     // 증가 여부
  previousLevel: string;   // 이전 레벨 (예: "2800")
}

/**
 * 지정된 일수 이전의 히스토리 항목을 찾습니다.
 *
 * @param history - 히스토리 배열
 * @param daysAgo - 찾으려는 일수 (1 = 전날, 7 = 1주일 전)
 * @param currentDate - 기준 시점 (character.lastUpdated)
 * @returns 가장 가까운 과거 히스토리 항목 또는 null
 */
function findHistoryByDaysAgo(
  history: Array<{ itemLevel: string; date: string }>,
  daysAgo: number,
  currentDate: string
): { itemLevel: string; date: string } | null {
  if (!history || history.length === 0) return null;

  const current = new Date(currentDate);
  const targetMinHours = daysAgo * HISTORY_CONSTANTS.HOURS_PER_DAY - HISTORY_CONSTANTS.TIME_TOLERANCE_HOURS;
  const targetMaxHours = daysAgo * HISTORY_CONSTANTS.HOURS_PER_DAY + HISTORY_CONSTANTS.TIME_TOLERANCE_HOURS;

  // 히스토리를 역순으로 순회 (최신부터)
  for (let i = history.length - 1; i >= 0; i--) {
    const historyDate = new Date(history[i].date);
    const hoursDiff = (current.getTime() - historyDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff >= targetMinHours && hoursDiff <= targetMaxHours) {
      return history[i];
    }
  }

  // 목표 범위에 없으면 가장 가까운 과거 항목 반환 (폴백)
  for (let i = history.length - 1; i >= 0; i--) {
    const historyDate = new Date(history[i].date);
    const hoursDiff = (current.getTime() - historyDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff >= targetMinHours) {
      return history[i];
    }
  }

  return null;
}

/**
 * DPS 점수 히스토리를 일수 기준으로 검색
 *
 * @param history - 히스토리 배열 (DPS 점수 포함)
 * @param daysAgo - 찾으려는 일수 (1 = 전날)
 * @param currentDate - 기준 시점 (character.lastUpdated)
 * @returns 가장 가까운 과거 히스토리 항목 또는 null
 */
function findDpsHistoryByDaysAgo(
  history: Array<{ dpsScore: string; date: string }>,
  daysAgo: number,
  currentDate: string
): { dpsScore: string; date: string } | null {
  if (!history || history.length === 0) return null;

  const current = new Date(currentDate);
  const targetMinHours = daysAgo * HISTORY_CONSTANTS.HOURS_PER_DAY - HISTORY_CONSTANTS.TIME_TOLERANCE_HOURS;
  const targetMaxHours = daysAgo * HISTORY_CONSTANTS.HOURS_PER_DAY + HISTORY_CONSTANTS.TIME_TOLERANCE_HOURS;

  // 히스토리를 역순으로 순회 (최신부터)
  for (let i = history.length - 1; i >= 0; i--) {
    const historyDate = new Date(history[i].date);
    const hoursDiff = (current.getTime() - historyDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff >= targetMinHours && hoursDiff <= targetMaxHours) {
      return history[i];
    }
  }

  // 목표 범위에 없으면 가장 가까운 과거 항목 반환 (폴백)
  for (let i = history.length - 1; i >= 0; i--) {
    const historyDate = new Date(history[i].date);
    const hoursDiff = (current.getTime() - historyDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff >= targetMinHours) {
      return history[i];
    }
  }

  return null;
}

/**
 * DPS 점수 전날 변화량 계산
 *
 * @param currentDps - 현재 DPS 점수
 * @param targetHistory - 비교 대상 히스토리 항목
 * @returns 변화 정보 또는 null
 */
function calculateDpsChangeFromHistory(
  currentDps: string,
  targetHistory: { dpsScore: string; date: string } | null
): HistoryChange | null {
  if (!targetHistory || !currentDps || !targetHistory.dpsScore) return null;

  const current = parseInt(currentDps);
  const previous = parseInt(targetHistory.dpsScore);

  if (isNaN(current) || isNaN(previous)) return null;

  const change = current - previous;

  // 변화가 0인 경우 특별 처리
  if (change === 0) {
    return {
      value: 0,
      isPositive: true, // 중립적인 값
      previousLevel: targetHistory.dpsScore
    };
  }

  return {
    value: change,
    isPositive: change > 0,
    previousLevel: targetHistory.dpsScore
  };
}

/**
 * 현재 레벨과 과거 레벨의 차이를 계산합니다.
 *
 * @param currentLevel - 현재 아이템 레벨
 * @param targetHistory - 비교 대상 히스토리 항목
 * @returns 변화 정보 또는 null
 */
function calculateChangeFromHistory(
  currentLevel: string,
  targetHistory: { itemLevel: string; date: string } | null
): HistoryChange | null {
  if (!targetHistory) return null;

  const current = parseInt(currentLevel);
  const previous = parseInt(targetHistory.itemLevel);
  const change = current - previous;

  // 변화가 0인 경우 특별 처리
  if (change === 0) {
    return {
      value: 0,
      isPositive: true, // 중립적인 값
      previousLevel: targetHistory.itemLevel
    };
  }

  return {
    value: change,
    isPositive: change > 0,
    previousLevel: targetHistory.itemLevel
  };
}

export default function CharacterList({ characters }: { characters: Character[] }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [sortMode, setSortMode] = useState<'itemLevel' | 'dpsScore'>('itemLevel');
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 정렬 로직 (정렬 모드에 따라 동적 정렬)
  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      if (sortMode === 'itemLevel') {
        // 아이템 레벨 내림차순
        const levelA = parseInt(a.itemLevel || '0');
        const levelB = parseInt(b.itemLevel || '0');
        return levelB - levelA;
      } else {
        // DPS 점수 내림차순
        const dpsA = parseInt(a.dpsScore || '0');
        const dpsB = parseInt(b.dpsScore || '0');

        // DPS가 없는 캐릭터(0)는 맨 아래
        if (dpsA === 0 && dpsB === 0) return 0;
        if (dpsA === 0) return 1;  // A를 뒤로
        if (dpsB === 0) return -1; // B를 뒤로

        return dpsB - dpsA;
      }
    });
  }, [characters, sortMode]);

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
        toast.success('캐릭터가 삭제되었습니다');
        router.refresh(); // 서버 컴포넌트만 새로고침 (빠름!)
      } else {
        const error = await response.json();
        toast.error(error.message || '삭제 실패');
      }
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다');
    }

    setShowDeleteConfirm(false);
    setCharacterToDelete(null);
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
      {/* 정렬 토글 버튼 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-400">정렬 기준:</span>

        <button
          onClick={() => setSortMode('itemLevel')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortMode === 'itemLevel'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          아이템 레벨 순
        </button>

        <button
          onClick={() => setSortMode('dpsScore')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortMode === 'dpsScore'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          DPS 점수 순
        </button>
      </div>

      <div className="overflow-x-auto">
        <p className="text-xs text-gray-400 mb-3">
          💡 캐릭터 이름을 클릭하면 AION2 공식 정보 페이지로 이동합니다
        </p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">순위</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">캐릭터 이름</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">클래스</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">아이템 레벨</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">DPS 점수</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">마지막 업데이트</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">액션</th>
            </tr>
          </thead>
          <tbody>
            {sortedCharacters.map((character, index) => {
              // 전날 변화량 계산 (아이템 레벨)
              let yesterdayChange = null;
              let dpsYesterdayChange = null;

              if (character.itemLevel && character.lastUpdated && character.history) {
                const yesterdayHistory = findHistoryByDaysAgo(
                  character.history,
                  HISTORY_CONSTANTS.DAYS_YESTERDAY,
                  character.lastUpdated
                );
                yesterdayChange = calculateChangeFromHistory(
                  character.itemLevel,
                  yesterdayHistory
                );

                // DPS 전날 변화량 계산
                if (character.dpsScore) {
                  const dpsYesterdayHistory = findDpsHistoryByDaysAgo(
                    character.history,
                    HISTORY_CONSTANTS.DAYS_YESTERDAY,
                    character.lastUpdated
                  );
                  dpsYesterdayChange = calculateDpsChangeFromHistory(
                    character.dpsScore,
                    dpsYesterdayHistory
                  );
                }
              }

              return (
                <tr
                  key={character.name}
                  className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  {/* 순위 */}
                  <td className="px-6 py-4 text-lg font-bold text-blue-400">
                    {index + 1}
                  </td>

                  {/* 캐릭터 이름 */}
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

                  {/* 클래스 */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300">
                      {character.characterClass || '-'}
                    </span>
                  </td>

                  {/* 아이템 레벨 (전날 변화 인라인) */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-blue-400">
                        {character.itemLevel ? parseInt(character.itemLevel).toLocaleString() : '-'}
                      </span>
                      {yesterdayChange && yesterdayChange.value !== 0 && (
                        <span className={`text-xs mt-1 ${
                          yesterdayChange.isPositive ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {yesterdayChange.isPositive ? '▲' : '▼'} {Math.abs(yesterdayChange.value).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* DPS 점수 (전날 변화 인라인) */}
                  <td className="px-6 py-4">
                    {character.dpsScore ? (
                      <div className="flex flex-col">
                        <span className="text-xl font-semibold text-purple-400">
                          {parseInt(character.dpsScore).toLocaleString()}
                        </span>
                        {dpsYesterdayChange && dpsYesterdayChange.value !== 0 && (
                          <span className={`text-xs mt-1 ${
                            dpsYesterdayChange.isPositive ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {dpsYesterdayChange.isPositive ? '▲' : '▼'} {Math.abs(dpsYesterdayChange.value).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">수집 중</span>
                    )}
                  </td>

                  {/* 마지막 업데이트 */}
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {isMounted && character.lastUpdated
                      ? new Date(character.lastUpdated).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>

                  {/* 삭제 버튼 */}
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
