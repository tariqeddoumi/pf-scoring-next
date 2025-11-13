'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Client = { client_id: string; code_client: string; client_name: string }
type Project = {
  project_id?: string
  client_id?: string | null
  code_project: string
  project_name: string
  project_type?: string | null
  address?: string | null
  region?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  description?: string | null
  capex?: number | null
  equity?: number | null
  debt?: number | null
  dscr?: number | null
}

export default function ProjectsPage(){
  const [clients, setClients] = useState<Client[]>([])
  const [list, setList] = useState<Project[]>([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<Partial<Project>>({ code_project:'', project_name:'' })
  const [selected, setSelected] = useState<Project | null>(null)

  const fetchClients = async ()=>{
    const { data } = await supabase.from('clients').select('client_id, code_client, client_name').order('client_name')
    setClients(data || [])
  }
  const fetchList = async ()=>{
    let req = supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(50)
    if (query.trim()){
      req = req.or(`code_project.ilike.%${query}%,project_name.ilike.%${query}%`)
    }
    const { data } = await req
    setList(data || [])
  }

  useEffect(()=>{ fetchClients(); fetchList() },[])
  useEffect(()=>{ const t=setTimeout(fetchList,300); return ()=>clearTimeout(t) },[query])

  const set = (k: keyof Project, v:any)=> setForm(s=>({ ...(s||{}), [k]: v }))

  const save = async ()=>{
    if (!form.code_project || !form.project_name) { alert('Code projet et Intitulé obligatoires'); return }
    const payload = { ...form }
    let res
    if (form.project_id){
      res = await supabase.from('projects').update(payload).eq('project_id', form.project_id).select().single()
    } else {
      res = await supabase.from('projects').insert(payload).select().single()
    }
    if (res.error) { alert(res.error.message); return }
    setSelected(null); setForm({ code_project:'', project_name:'' })
    await fetchList()
  }

  const edit = (p: Project)=>{ setSelected(p); setForm(p) }
  const remove = async (p: Project)=>{
    if (!confirm(`Supprimer le projet ${p.project_name} ?`)) return
    const { error } = await supabase.from('projects').delete().eq('project_id', p.project_id!)
    if (error) { alert(error.message); return }
    await fetchList()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Projets</h1>

      <div className="bg-white p-3 rounded border space-y-2">
        <div className="flex gap-2">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Recherche code / intitulé…" className="border p-2 flex-1 rounded"/>
          <button onClick={fetchList} className="px-3 py-2 rounded bg-gray-200">Actualiser</button>
        </div>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Intitulé</th>
              <th className="p-2 text-left">Client</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p=>(
              <tr key={p.project_id} className="border-t">
                <td className="p-2">{p.code_project}</td>
                <td className="p-2">{p.project_name}</td>
                <td className="p-2">{clients.find(c=>c.client_id===p.client_id)?.client_name || '-'}</td>
                <td className="p-2 text-center">
                  <button onClick={()=>edit(p)} className="px-2 py-1 rounded bg-blue-600 text-white mr-2">Éditer</button>
                  <button onClick={()=>remove(p)} className="px-2 py-1 rounded bg-red-600 text-white">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-3 rounded border space-y-3">
        <h2 className="font-semibold">{selected ? 'Modifier le projet' : 'Nouveau projet'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="Code projet" value={form.code_project||''} onChange={e=>set('code_project',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Intitulé" value={form.project_name||''} onChange={e=>set('project_name',e.target.value)} />
          <select className="border p-2 rounded" value={form.client_id||''} onChange={e=>set('client_id', e.target.value||null)}>
            <option value="">— Choisir un client —</option>
            {clients.map(c=>(
              <option key={c.client_id} value={c.client_id}>{c.client_name} ({c.code_client})</option>
            ))}
          </select>
          <input className="border p-2 rounded" placeholder="Type de projet" value={form.project_type||''} onChange={e=>set('project_type',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Région" value={form.region||''} onChange={e=>set('region',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Ville" value={form.city||''} onChange={e=>set('city',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Adresse" value={form.address||''} onChange={e=>set('address',e.target.value)} />
          <input className="border p-2 rounded" type="number" step="0.000001" placeholder="Latitude" value={form.latitude??''} onChange={e=>set('latitude', e.target.value ? Number(e.target.value): null)} />
          <input className="border p-2 rounded" type="number" step="0.000001" placeholder="Longitude" value={form.longitude??''} onChange={e=>set('longitude', e.target.value ? Number(e.target.value): null)} />
          <input className="border p-2 rounded" type="number" placeholder="CAPEX" value={form.capex??''} onChange={e=>set('capex', e.target.value? Number(e.target.value): null)} />
          <input className="border p-2 rounded" type="number" placeholder="Equity" value={form.equity??''} onChange={e=>set('equity', e.target.value? Number(e.target.value): null)} />
          <input className="border p-2 rounded" type="number" placeholder="Debt" value={form.debt??''} onChange={e=>set('debt', e.target.value? Number(e.target.value): null)} />
          <input className="border p-2 rounded" type="number" step="0.001" placeholder="DSCR" value={form.dscr??''} onChange={e=>set('dscr', e.target.value? Number(e.target.value): null)} />
          <textarea className="border p-2 rounded col-span-2" placeholder="Description" value={form.description||''} onChange={e=>set('description',e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-2 rounded bg-green-600 text-white">Enregistrer</button>
          <button onClick={()=>{setSelected(null); setForm({ code_project:'', project_name:'' })}} className="px-3 py-2 rounded bg-gray-200">Nouveau</button>
        </div>
      </div>
    </div>
  )
}
