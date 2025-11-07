'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = { dim:string; k:string|null; nb_projects:number; total_approved:number|null; total_crd:number|null }
export default function Home() {
  const [rows,setRows]=useState<Row[]>([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{(async()=>{
    const {data,error}=await supabase.from('v_pf_dashboard').select('*')
    if(!error&&data) setRows(data as Row[])
    setLoading(false)
  })()},[])

  const sum=(f: (r:Row)=>number)=> rows.reduce((a,r)=>a+(f(r)||0),0)
  const totalProj = new Set(rows.map(r=>`${r.dim}:${r.k}`)).size // approx visuelle
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Tableau de bord — Project Finance</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Projets (approx)" value={totalProj} />
        <Card title="Montant approuvé" value={`${sum(r=>Number(r.total_approved||0)).toLocaleString()} MAD`} />
        <Card title="CRD total" value={`${sum(r=>Number(r.total_crd||0)).toLocaleString()} MAD`} />
        <Card title="Dimensions suivies" value={new Set(rows.map(r=>r.dim)).size} />
      </div>

      {loading? <div>Chargement…</div>:
        ['SECTEUR','BANQUE','AGENCE','TYPE'].map(dim=>(
          <section key={dim} className="bg-white border rounded p-4">
            <h2 className="font-semibold mb-2">{dim}</h2>
            <div className="overflow-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">{dim}</th>
                    <th className="border px-2 py-1"># projets</th>
                    <th className="border px-2 py-1">Approuvé</th>
                    <th className="border px-2 py-1">CRD</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.filter(r=>r.dim===dim).map((r,i)=>(
                    <tr key={i}>
                      <td className="border px-2 py-1">{r.k||'(n/a)'}</td>
                      <td className="border px-2 py-1">{r.nb_projects}</td>
                      <td className="border px-2 py-1">{(r.total_approved||0).toLocaleString()}</td>
                      <td className="border px-2 py-1">{(r.total_crd||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      }
    </div>
  )
}
function Card({title,value}:{title:string;value:any}) {
  return <div className="bg-white border rounded p-4"><div className="text-gray-500 text-sm">{title}</div><div className="text-2xl font-bold">{value}</div></div>
}
