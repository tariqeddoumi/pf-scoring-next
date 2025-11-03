'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()
  const is = (href: string) =>
    pathname === href ? 'bg-black text-white' : 'hover:bg-gray-200'

  return (
    <nav className="flex gap-2 p-3 border-b bg-white sticky top-0">
      <Link href="/" className={`px-3 py-2 rounded ${is('/')}`}>Accueil</Link>
      <Link href="/clients" className={`px-3 py-2 rounded ${is('/clients')}`}>Clients</Link>
      <Link href="/projects" className={`px-3 py-2 rounded ${is('/projects')}`}>Projets</Link>
      <Link href="/scoring/new" className={`px-3 py-2 rounded ${is('/scoring/new')}`}>Scoring</Link>
      <Link href="/login" className={`px-3 py-2 rounded ${is('/login')}`}>Login</Link>
    </nav>
  )
}
