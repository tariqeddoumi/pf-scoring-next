import './globals.css'
import Nav from '@/components/Nav'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'PF Scoring v1.2',
  description: 'Project Finance Scoring – Next.js + Supabase'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900">
        <Nav />
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}
