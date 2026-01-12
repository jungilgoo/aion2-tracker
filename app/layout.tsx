import './globals.css'
import type { Metadata } from 'next'
import ClientLayout from './components/ClientLayout'

export const metadata: Metadata = {
  title: '아이온2 Netflix 레기온',
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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
