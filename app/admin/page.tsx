'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Domain = { id:number; code:string; label:string; weight:number; order_idx:number; active:boolean }
type Criterion = { id:number; domain_id:number; code:string; label:string; weight:number; order_idx:number; active:boolean }
type SubCrit = { id:number; criterion_id:number; code:string; label:string; weight:number; order_idx:number; active:boolean }
type Option = { id:number; owner_kind:string; owner_id:number; value_code:string; value_label:string; score:number; order_idx:number; active:boolean }

export default function AdminPage(){
  const [domains, setDomains] = useState<Domain[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [subs, setSubs] = useState<SubCrit[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async ()=>{
    setLoading(true)
    const [d, c, s, o] = await Promise.all([
      supabase.from('score_domains').select('*').order('order_idx'),
      supabase.from('score_criteria').select('*').order('order_idx'),
      supabase.from('score_subcriteria').select('*').order('order_idx'),
      supabase.from('score_options').select('*').order('order_idx')
    ])
    setDomains(d.data || [])
    setCriteria(c.data || [])
    setSubs(s.data || [])
    setOptions(o.data || [])
    setLoading(false)
  }

  useEffect(()=>{ refresh() },[])

  const updateRow = async (table:string, idKey:string, row:any)=>{
    const { error } = await supabase.from(table).update(row).eq(idKey, row[idKey]).select().single()
    if (error) alert(error.message)
  }

  if (loading) return <div>Chargement…</div>

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Paramétrage de scoring</h1>

      {/* Domains */}
      <section className="bg-white p-3 border rounded">
        <h2 className="font-semibold mb-2">Domains</h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th><th className="p-2">Code</th><th className="p-2">Label</th><th className="p-2">Weight</th><th className="p-2">Order</th><th className="p-2">Actif</th><th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {domains.map(d=>(
              <tr key={d.id} className="border-t">
                <td className="p-2">{d.id}</td>
                <td className="p-2"><input className="border p-1 rounded w-32" defaultValue={d.code} onBlur={e=>updateRow('score_domains','id',{...d, code:e.target.value})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-full" defaultValue={d.label} onBlur={e=>updateRow('score_domains','id',{...d, label:e.target.value})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-20" type="number" step="0.0001" defaultValue={d.weight} onBlur={e=>updateRow('score_domains','id',{...d, weight:Number(e.target.value)})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-16" type="number" defaultValue={d.order_idx} onBlur={e=>updateRow('score_domains','id',{...d, order_idx:Number(e.target.value)})}/></td>
                <td className="p-2 text-center">
                  <input type="checkbox" defaultChecked={d.active} onChange={e=>updateRow('score_domains','id',{...d, active:e.target.checked})}/>
                </td>
                <td className="p-2 text-right text-gray-400">auto-save</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Criteria */}
      <section className="bg-white p-3 border rounded">
        <h2 className="font-semibold mb-2">Criteria</h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th><th className="p-2">Domain</th><th className="p-2">Code</th><th className="p-2">Label</th><th className="p-2">Weight</th><th className="p-2">Order</th><th className="p-2">Actif</th><th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map(c=>(
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.id}</td>
                <td className="p-2">{c.domain_id}</td>
                <td className="p-2"><input className="border p-1 rounded w-28" defaultValue={c.code} onBlur={e=>updateRow('score_criteria','id',{...c, code:e.target.value})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-full" defaultValue={c.label} onBlur={e=>updateRow('score_criteria','id',{...c, label:e.target.value})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-20" type="number" step="0.0001" defaultValue={c.weight} onBlur={e=>updateRow('score_criteria','id',{...c, weight:Number(e.target.value)})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-16" type="number" defaultValue={c.order_idx} onBlur={e=>updateRow('score_criteria','id',{...c, order_idx:Number(e.target.value)})}/></td>
                <td className="p-2 text-center">
                  <input type="checkbox" defaultChecked={c.active} onChange={e=>updateRow('score_criteria','id',{...c, active:e.target.checked})}/>
                </td>
                <td className="p-2 text-right text-gray-400">auto-save</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Subcriteria */}
      <section className="bg-white p-3 border rounded">
        <h2 className="font-semibold mb-2">Subcriteria</h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th><th className="p-2">Criterion</th><th className="p-2">Code</th><th className="p-2">Label</th><th className="p-2">Weight</th><th className="p-2">Order</th><th className="p-2">Actif</th><th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s=>(
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.id}</td>
                <td className="p-2">{s.criterion_id}</td>
                <td className="p-2"><input className="border p-1 rounded w-28" defaultValue={s.code} onBlur={e=>updateRow('score_subcriteria','id',{...s, code:e.target.value})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-full" defaultValue={s.label} onBlur={e=>updateRow('score_subcriteria','id',{...s, label:e.target.value})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-20" type="number" step="0.0001" defaultValue={s.weight} onBlur={e=>updateRow('score_subcriteria','id',{...s, weight:Number(e.target.value)})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-16" type="number" defaultValue={s.order_idx} onBlur={e=>updateRow('score_subcriteria','id',{...s, order_idx:Number(e.target.value)})}/></td>
                <td className="p-2 text-center">
                  <input type="checkbox" defaultChecked={s.active} onChange={e=>updateRow('score_subcriteria','id',{...s, active:e.target.checked})}/>
                </td>
                <td className="p-2 text-right text-gray-400">auto-save</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Options */}
      <section className="bg-white p-3 border rounded">
        <h2 className="font-semibold mb-2">Options</h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th><th className="p-2">Owner</th><th className="p-2">Code</th><th className="p-2">Label</th><th className="p-2">Score</th><th className="p-2">Order</th><th className="p-2">Actif</th><th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {options.slice(0,400).map(o=>(
              <tr key={o.id} className="border-t">
                <td className="p-2">{o.id}</td>
                <td className="p-2">{o.owner_kind}:{o.owner_id}</td>
                <td className="p-2"><input className="border p-1 rounded w-16" defaultValue={o.value_code} onBlur={e=>updateRow('score_options','id',{...o, value_code:e.target.value})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-full" defaultValue={o.value_label} onBlur={e=>updateRow('score_options','id',{...o, value_label:e.target.value})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-20" type="number" step="0.0001" defaultValue={o.score} onBlur={e=>updateRow('score_options','id',{...o, score:Number(e.target.value)})}/></td>
                <td className="p-2"><input className="border p-1 rounded w-16" type="number" defaultValue={o.order_idx} onBlur={e=>updateRow('score_options','id',{...o, order_idx:Number(e.target.value)})}/></td>
                <td className="p-2 text-center">
                  <input type="checkbox" defaultChecked={o.active} onChange={e=>updateRow('score_options','id',{...o, active:e.target.checked})}/>
                </td>
                <td className="p-2 text-right text-gray-400">auto-save</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Astuce : filtre/pagination à ajouter si nécessaire (la table peut être volumineuse).</p>
      </section>
    </div>
  )
}
