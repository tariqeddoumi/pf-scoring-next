import "./globals.css"
import Nav from "@/components/Nav"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PF Scoring",
  description: "Project Finance Scoring — Next.js + Supabase",
}

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="fr">
      <body>
        <Nav />
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}
