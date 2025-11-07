'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Project = {
  project_id: string
  code_project: string
  project_name: string
  city?: string|null
  region?: string|null
  project_type?: string|null
  client_id?: string|null
}

type Client = {
  client_id: string
  client_name: string
  code_client: string
}

type CreditRow = {
  app_id: string
  status: string
  total_amount: number|null
  total_crd: number|null
}

export default function ProjectsPage(){

  // état
  const [q,setQ]=useState('')
  const [list,setList]=useState<Project[]>([])
  const [clients,setClients]=useState<Client[]>([])
  const [sel,setSel]=useState<Project|null>(null)
  const [edit,setEdit]=useState<Partial<Project>>({})
  const [credits,setCredits]=useState<CreditRow[]>([])

  // chargement liste projets
  const loadList=async()=>{
    const { data, error } = await supabase
      .from('projects')
      .select('project_id,code_project,project_name,city,region,project_type,client_id,created_at')
      .order('created_at',{ascending:false})
      .limit(100)
    if(!error&&data) setList(data as any)
  }

  // recherche
  const search=async()=>{
    if(!q){ await loadList(); return }
    const { data, error } = await supabase
      .from('projects')
      .select('project_id,code_project,project_name,city,region,project_type,client_id,created_at')
      .or(`code_project.ilike.%${q}%,project_name.ilike.%${q}%`)
      .order('created_at',{ascending:false})
      .limit(100)
    if(!error&&data) setList(data as any)
  }

  // chargement clients pour dropdown
  const loadClients=async()=>{
    const { data, error } = await supabase
      .from('clients')
      .select('client_id,client_name,code_client')
      .order('client_name')
    if(!error&&data) setClients(data as any)
  }

  // chargement demandes liées
  const loadCredits=async(project_id:string)=>{
    const { data, error } = await supabase.rpc('project_credit_summary',{ p_project_id:project_id })
    if(!error&&data) setCredits(data as CreditRow[])
  }

  useEffect(()=>{loadList();loadClients()},[])

  const selectProject=(p:Project)=>{
    setSel(p)
    setEdit(p)
    loadCredits(p.project_id)
  }

  const save=async()=>{
    if(!edit.code_project || !edit.project_name){
      alert('Code projet & Nom requis.')
      return
    }
    const { error } = await supabase.from('projects').upsert([{
      project_id: edit.project_id || undefined,
      code_project: edit.code_project,
      project_name: edit.project_name,
      client_id: edit.client_id || null,
      city: edit.city || null,
      region: edit.region || null,
      project_type: edit.project_type || null
    }])
    if(error){ alert('Erreur: '+error.message); return }
    alert('Projet enregistré ✅')
    await loadList()
  }

  const remove=async()=>{
    if(!sel) return
    const { count } = await supabase.from('credit_applications').select('app_id',{count:'exact',head:true}).eq('project_id',sel.project_id)
    if((count||0)>0){
      alert('Suppression impossible: ce projet possède des demandes de crédit.')
      return
    }
    const { error } = await supabase.from('projects').delete().eq('project_id', sel.project_id)
    if(error){ alert('Erreur suppression: '+error.message); return }
    setSel(null); setEdit({}); await loadList(); setCredits([])
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Projets</h1>

      {/* Bloc 1 — Liste, recherche, actions */}
      <section className="bg-white border rounded p-4 space-y-3">
        <div className="flex gap-2">
          <input className="border p-2 rounded flex-1" placeholder="Recherche par code projet ou nom…" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="px-3 py-2 border rounded" onClick={search}>Rechercher</button>
          <button className="px-3 py-2 border rounded" onClick={loadList}>Récents</button>
          <button className="px-3 py-2 border rounded" onClick={()=>{setSel(null);setEdit({})}}>Nouveau projet</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr><th className="border px-2 py-1">Code</th><th className="border px-2 py-1">Nom</th><th className="border px-2 py-1">Ville</th><th className="border px-2 py-1">Type</th><th className="border px-2 py-1">Actions</th></tr>
            </thead>
            <tbody>
              {list.map(p=>(
                <tr key={p.project_id}>
                  <td className="border px-2 py-1">{p.code_project}</td>
                  <td className="border px-2 py-1">{p.project_name}</td>
                  <td className="border px-2 py-1">{p.city||''}</td>
                  <td className="border px-2 py-1">{p.project_type||''}</td>
                  <td className="border px-2 py-1">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded" onClick={()=>selectProject(p)}>Afficher</button>
                      <button className="px-2 py-1 border rounded" onClick={()=>selectProject(p)}>Éditer</button>
                      <button className="px-2 py-1 border rounded" onClick={remove}>Supprimer</button>
                      <a className="px-2 py-1 border rounded" href="/credit/new">+ Demande crédit</a>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length===0 && <tr><td colSpan={5} className="border px-2 py-4 text-center text-gray-500">Aucun projet</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bloc 2 — Détail / Édition */}
      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Détail / Édition</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="Code projet" value={edit.code_project||''} onChange={e=>setEdit(s=>({...s,code_project:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Nom du projet" value={edit.project_name||''} onChange={e=>setEdit(s=>({...s,project_name:e.target.value}))}/>
          <select className="border p-2 rounded" value={edit.client_id||''} onChange={e=>setEdit(s=>({...s,client_id:e.target.value||null}))}>
            <option value="">— Client —</option>
            {clients.map(c=><option key={c.client_id} value={c.client_id}>{c.code_client} — {c.client_name}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Ville" value={edit.city||''} onChange={e=>setEdit(s=>({...s,city:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Région" value={edit.region||''} onChange={e=>setEdit(s=>({...s,region:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Type de projet (ex: Énergie, Immobilier…)" value={edit.project_type||''} onChange={e=>setEdit(s=>({...s,project_type:e.target.value}))}/>
        </div>
        <div className="flex gap-2">
          <button className="bg-black text-white px-4 py-2 rounded" onClick={save}>Enregistrer</button>
        </div>
      </section>

      {/* Bloc 3 — Demandes de crédit liées */}
      <section className="bg-white border rounded p-4">
        <h2 className="font-semibold">Demandes de crédit associées</h2>
        {sel? (
          <div className="overflow-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr><th className="border px-2 py-1">Statut</th><th className="border px-2 py-1">Montant demandé</th><th className="border px-2 py-1">CRD</th></tr>
              </thead>
              <tbody>
                {credits.map(c=>(
                  <tr key={c.app_id}>
                    <td className="border px-2 py-1">{c.status}</td>
                    <td className="border px-2 py-1">{(c.total_amount||0).toLocaleString()}</td>
                    <td className="border px-2 py-1">{(c.total_crd||0).toLocaleString()}</td>
                  </tr>
                ))}
                {credits.length===0 && <tr><td colSpan={3} className="border px-2 py-4 text-center text-gray-500">Aucune demande</td></tr>}
              </tbody>
            </table>
          </div>
        ): <div className="text-gray-500">Sélectionne un projet ci-dessus…</div>}
      </section>

    </div>
  )
}
