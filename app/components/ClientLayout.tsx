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
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
            aria-label="아툴 계산 방식 도움말"
            title="아툴 계산 방식 도움말"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
