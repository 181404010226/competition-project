import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '国学文化游戏',
  description: '基于国学+AI+游戏的融合创新项目',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="font-sans">
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
          {children}
        </main>
      </body>
    </html>
  )
} 