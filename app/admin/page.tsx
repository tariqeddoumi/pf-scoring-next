'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type AppUser = { user_id: string|null, email: string|null, display_name: string|null, role: 'ADMIN'|'RM'|'VIEWER' }
type Setting = { key: string; value: any }

export default function Admin(){
  const [users, setUsers] = useState<AppUser[]>([])
  const [settings, setSettings] = useState<Setting[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')

  const load = async ()=>{
    const u = await supabase.from('app_users').select('user_id,email,display_name,role').order('email')
    setUsers(u.data||[])
    const s = await supabase.from('app_settings').select('key,value').order('key')
    setSettings(s.data||[])
  }
  useEffect(()=>{ load() },[])

  const promoteAdmin = async ()=>{
    if(!newAdminEmail) return
    await supabase.from('admin_emails').upsert({ email: newAdminEmail.toLowerCase() })
    await load(); setNewAdminEmail('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Administration</h1>

      <section>
        <h2 className="font-semibold mb-2">Paramètres (lecture)</h2>
        <ul className="list-disc pl-5">
          {settings.map(s=> <li key={s.key}><b>{s.key}</b>: <code>{JSON.stringify(s.value)}</code></li>)}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Utilisateurs (app_users)</h2>
        <table className="w-full bg-white border">
          <thead><tr className="bg-gray-100 text-left">
            <th className="p-2">Email</th><th>Nom</th><th>Rôle</th></tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.email||Math.random()} className="border-t">
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.display_name}</td>
                <td className="p-2">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex gap-2">
          <input value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)}
                 placeholder="email à promouvoir admin" className="border px-2 py-1 rounded w-80" />
          <button onClick={promoteAdmin} className="px-3 py-1 bg-black text-white rounded">Ajouter à admin_emails</button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Au login, un utilisateur dont l'email est listé dans <code>admin_emails</code> pourra être promu ADMIN (via un petit upsert app_users côté front).</p>
      </section>
    </div>
  )
}
