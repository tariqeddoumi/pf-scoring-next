'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={
        'px-3 py-2 rounded ' +
        (pathname === href ? 'bg-black text-white' : 'hover:bg-gray-200')
      }
      >
      {label}
    </Link>
  )

  return (
    <nav className="flex gap-2 p-3 border-b bg-white sticky top-0">
      {link('/', 'Accueil')}
      {link('/clients', 'Clients')}
      {link('/projects', 'Projets')}
      {link('/scoring/new', 'Scoring')}
      {link('/login', 'Login')}
    </nav>
  )
}


