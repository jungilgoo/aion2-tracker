import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AION2 캐릭터 추적기',
  description: '마족 루미엘 서버 캐릭터 아이템 레벨 추적',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-900 text-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-center mb-2">
              AION2 캐릭터 추적기
            </h1>
            <p className="text-center text-gray-400">
              마족 루미엘 서버 | 아이템 레벨 자동 추적
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
