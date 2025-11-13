'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

function NavLink({href, label}:{href:string; label:string}) {
  const path = usePathname()
  const active = path === href
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded ${active ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
    >
      {label}
    </Link>
  )
}

export default function Nav(){
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(()=>{
    supabase.auth.getUser().then(({ data })=>{
      setUserEmail(data.user?.email ?? null)
    })
  },[])

  const logout = async ()=>{
    await supabase.auth.signOut()
    setUserEmail(null)
  }

  return (
    <nav className="flex items-center gap-2 p-3 border-b bg-white sticky top-0 z-10">
      <NavLink href="/" label="Dashboard" />
      <NavLink href="/clients" label="Clients" />
      <NavLink href="/projects" label="Projets" />
      <NavLink href="/scoring" label="Scoring" />
      <NavLink href="/scoring/new" label="Nouvelle évaluation" />
      <NavLink href="/admin" label="Admin" />
      <div className="ml-auto flex items-center gap-2">
        {userEmail ? (
          <>
            <span className="text-sm text-gray-600">{userEmail}</span>
            <button onClick={logout} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Logout</button>
          </>
        ) : (
          <Link href="/login" className="px-3 py-2 rounded bg-gray-900 text-white">Login</Link>
        )}
      </div>
    </nav>
  )
}
