'use client';

import { useEffect, useState } from 'react';

interface LastUpdateProps {
  lastUpdated?: string;
}

export default function LastUpdate({ lastUpdated }: LastUpdateProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="mt-8 text-center text-gray-500 text-sm">
      <p>매일 자동으로 업데이트됩니다</p>
      <p className="mt-2">
        마지막 업데이트: {isMounted && lastUpdated
          ? new Date(lastUpdated).toLocaleString('ko-KR')
          : '아직 없음'}
      </p>
    </div>
  );
}
