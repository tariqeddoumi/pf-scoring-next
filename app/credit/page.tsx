'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = { app_id:string; project_id:string|null; client_id:string|null; status:string; amount_requested:number|null; currency:string|null; project_name?:string|null; client_name?:string|null }
export default function CreditList(){
  const [q,setQ]=useState('')
  const [rows,setRows]=useState<Row[]>([])
  const load=async()=>{
    const { data, error } = await supabase.rpc('credit_applications_list', { p_query:q||null })
    if(!error&&data) setRows(data as Row[])
  }
  useEffect(()=>{load()},[])
  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <input className="border p-2 rounded flex-1" placeholder="Recherche projet/client/statut…" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="px-3 py-2 border rounded" onClick={load}>Rechercher</button>
        <a className="px-3 py-2 border rounded" href="/credit/new">Nouvelle demande</a>
      </div>
      <div className="overflow-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr><th className="border px-2 py-1">Projet</th><th className="border px-2 py-1">Client</th><th className="border px-2 py-1">Statut</th><th className="border px-2 py-1">Montant</th></tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.app_id}>
                <td className="border px-2 py-1">{r.project_name||''}</td>
                <td className="border px-2 py-1">{r.client_name||''}</td>
                <td className="border px-2 py-1">{r.status}</td>
                <td className="border px-2 py-1">{(r.amount_requested||0).toLocaleString()} {(r.currency||'')}</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={4} className="border px-2 py-4 text-center text-gray-500">Aucun résultat</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
