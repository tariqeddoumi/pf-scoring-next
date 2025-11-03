// components/Nav.tsx (ajoute ce bloc)
"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Nav(){
  // ...
  const [logged, setLogged] = useState(false)
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=> setLogged(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s)=> setLogged(!!s))
    return ()=> sub.subscription.unsubscribe()
  },[])
  const logout = async ()=> { await supabase.auth.signOut(); location.reload() }

  return (
    <nav className="flex gap-2 p-3 border-b bg-white sticky top-0">
      {/* liens existants */}
      {logged && <button onClick={logout} className="ml-auto px-3 py-2 rounded bg-gray-800 text-white">Logout</button>}
    </nav>
  )
}
