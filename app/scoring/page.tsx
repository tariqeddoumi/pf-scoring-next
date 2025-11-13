'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type EvalRow = {
  eval_id: string
  project_id: string
  client_id: string | null
  score_final: number | null
  grade: string | null
  pd: number | null
  created_at: string
  project_name?: string
  client_name?: string
}

export default function ScoringList(){
  const [rows, setRows] = useState<EvalRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      // jointures légères via deux requêtes
      const { data: evals } = await supabase.from('evaluations').select('*').order('created_at',{ascending:false}).limit(100)
      const pIds = Array.from(new Set((evals||[]).map(e=>e.project_id)))
      const cIds = Array.from(new Set((evals||[]).map(e=>e.client_id).filter(Boolean))) as string[]

      const [{ data: projs }, { data: clients }] = await Promise.all([
        supabase.from('projects').select('project_id, project_name'),
        supabase.from('clients').select('client_id, client_name').in('client_id', cIds.length? cIds : ['00000000-0000-0000-0000-000000000000'])
      ])

      const pMap = new Map((projs||[]).map(p=>[p.project_id, p.project_name]))
      const cMap = new Map((clients||[]).map(c=>[c.client_id, c.client_name]))

      setRows((evals||[]).map(e=>({
        ...e,
        project_name: pMap.get(e.project_id),
        client_name: e.client_id ? cMap.get(e.client_id) : null
      })))
      setLoading(false)
    })()
  },[])

  if (loading) return <div>Chargement…</div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Évaluations</h1>
      <table className="w-full border bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Projet</th>
            <th className="p-2 text-left">Client</th>
            <th className="p-2 text-right">Score</th>
            <th className="p-2 text-left">Grade</th>
            <th className="p-2 text-right">PD</th>
            <th className="p-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.eval_id} className="border-t">
              <td className="p-2">{r.project_name}</td>
              <td className="p-2">{r.client_name ?? '-'}</td>
              <td className="p-2 text-right">{r.score_final?.toFixed(2)}</td>
              <td className="p-2">{r.grade ?? '-'}</td>
              <td className="p-2 text-right">{r.pd ?? '-'}</td>
              <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
