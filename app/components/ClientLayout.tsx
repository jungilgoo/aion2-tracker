'use client';

import { useState } from 'react';
import { Toaster } from 'sonner';
import HelpModal from './HelpModal';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 relative">
          {/* 도움말 버튼 - 우측 상단 */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="absolute top-0 right-0 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg border border-gray-600 hover:border-gray-500"
            aria-label="아툴 점수 산출 방식"
            title="아툴 점수 산출 방식"
          >
            아툴 점수 산출 방식
          </button>

          <h1 className="text-4xl font-bold text-center mb-2">
            아이온2 Netflix 레기온
          </h1>
          <p className="text-center text-gray-400">
            마족 루미엘 서버 | 길드원 아이템 레벨
          </p>
        </header>
        {children}
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  );
}
