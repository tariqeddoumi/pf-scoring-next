'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Row = {
  dim: string
  k: string
  nb_projects: number
  total_approved: number
  total_crd: number
}

export default function Home() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      const { data, error } = await supabase.from('v_pf_dashboard').select('*')
      if (error) console.error(error)
      setRows(data || [])
      setLoading(false)
    })()
  },[])

  if (loading) return <div>Chargement…</div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tableau de bord</h1>
      <table className="w-full border bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Dimension</th>
            <th className="p-2 text-left">Valeur</th>
            <th className="p-2 text-right"># Projets</th>
            <th className="p-2 text-right">Montant approuvé</th>
            <th className="p-2 text-right">CRD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i)=>(
            <tr key={i} className="border-t">
              <td className="p-2">{r.dim}</td>
              <td className="p-2">{r.k}</td>
              <td className="p-2 text-right">{r.nb_projects ?? 0}</td>
              <td className="p-2 text-right">{r.total_approved?.toLocaleString()}</td>
              <td className="p-2 text-right">{r.total_crd?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
