'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Client = { client_id:string; code_client:string; client_name:string; secteur?:string|null; code_agence?:string|null; nom_agence?:string|null; updated_at?:string|null }
type Project = { project_id:string; code_project:string; project_name:string; city?:string|null }
export default function Clients(){
  const [q,setQ]=useState('')   // recherche
  const [list,setList]=useState<Client[]>([])
  const [sel,setSel]=useState<Client|null>(null)
  const [edit,setEdit]=useState<Partial<Client>>({})
  const [projects,setProjects]=useState<Project[]>([])

  const loadList=async()=>{
    const { data, error } = await supabase
      .from('clients')
      .select('client_id,code_client,client_name,secteur,code_agence,nom_agence,created_at')
      .order('created_at',{ascending:false})
      .limit(100)
    if(!error&&data) setList(data as any)
  }
  const search=async()=>{
    if(!q){ await loadList(); return }
    const { data, error } = await supabase
      .from('clients')
      .select('client_id,code_client,client_name,secteur,code_agence,nom_agence,created_at')
      .or(`code_client.ilike.%${q}%,client_name.ilike.%${q}%`)
      .order('created_at',{ascending:false})
      .limit(100)
    if(!error&&data) setList(data as any)
  }
  const loadProjects=async (client_id:string)=>{
    const { data, error } = await supabase.from('projects')
      .select('project_id,code_project,project_name,city').eq('client_id',client_id).order('created_at',{ascending:false})
    if(!error&&data) setProjects(data as any)
  }
  useEffect(()=>{loadList()},[])

  const selectClient=(c:Client)=>{ setSel(c); setEdit(c); loadProjects(c.client_id) }

  const save=async()=>{
    if(!edit.code_client || !edit.client_name){ alert('Code et Nom requis.'); return }
    const { error } = await supabase.from('clients').upsert([{
      client_id: edit.client_id || undefined,
      code_client: edit.code_client,
      client_name: edit.client_name,
      secteur: edit.secteur || null,
      code_agence: edit.code_agence || null,
      nom_agence: edit.nom_agence || null
    }])
    if(error){ alert('Erreur: '+error.message); return }
    alert('Client enregistré ✅'); await loadList()
  }

  const remove=async()=>{
    if(!sel) return
    // refuse si projets associés
    const { count } = await supabase.from('projects').select('project_id', { count: 'exact', head:true }).eq('client_id', sel.client_id)
    if((count||0)>0){ alert('Suppression impossible: projets associés.'); return }
    const { error } = await supabase.from('clients').delete().eq('client_id', sel.client_id)
    if(error){ alert('Erreur suppression: '+error.message); return }
    setSel(null); setEdit({}); await loadList(); setProjects([])
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Clients</h1>

      {/* Bloc 1: Liste + recherche + actions */}
      <section className="bg-white border rounded p-4 space-y-3">
        <div className="flex gap-2">
          <input className="border p-2 rounded flex-1" placeholder="Recherche par code client ou nom…" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="px-3 py-2 border rounded" onClick={search}>Rechercher</button>
          <button className="px-3 py-2 border rounded" onClick={loadList}>Récents</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr><th className="border px-2 py-1">Code</th><th className="border px-2 py-1">Nom</th><th className="border px-2 py-1">Secteur</th><th className="border px-2 py-1">Agence</th><th className="border px-2 py-1">Actions</th></tr>
            </thead>
            <tbody>
              {list.map(c=>(
                <tr key={c.client_id}>
                  <td className="border px-2 py-1">{c.code_client}</td>
                  <td className="border px-2 py-1">{c.client_name}</td>
                  <td className="border px-2 py-1">{c.secteur||''}</td>
                  <td className="border px-2 py-1">{c.nom_agence||''}</td>
                  <td className="border px-2 py-1">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded" onClick={()=>selectClient(c)}>Afficher</button>
                      <button className="px-2 py-1 border rounded" onClick={()=>selectClient(c)}>Éditer</button>
                      <button className="px-2 py-1 border rounded" onClick={remove}>Supprimer</button>
                      <a className="px-2 py-1 border rounded" href="/projects">+ Projet</a>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length===0 && <tr><td colSpan={5} className="border px-2 py-4 text-center text-gray-500">Aucun client</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bloc 2: Détail/édition */}
      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Détail / Édition</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="Code client" value={edit.code_client||''} onChange={e=>setEdit(s=>({...s,code_client:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Nom" value={edit.client_name||''} onChange={e=>setEdit(s=>({...s,client_name:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Secteur" value={edit.secteur||''} onChange={e=>setEdit(s=>({...s,secteur:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Code agence" value={edit.code_agence||''} onChange={e=>setEdit(s=>({...s,code_agence:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Nom agence" value={edit.nom_agence||''} onChange={e=>setEdit(s=>({...s,nom_agence:e.target.value}))}/>
        </div>
        <div className="flex gap-2">
          <button className="bg-black text-white px-4 py-2 rounded" onClick={save}>Enregistrer</button>
          <button className="px-3 py-2 border rounded" onClick={()=>{setSel(null);setEdit({})}}>Nouveau</button>
        </div>
      </section>

      {/* Bloc 3: Projets du client */}
      <section className="bg-white border rounded p-4">
        <h2 className="font-semibold">Projets du client</h2>
        {sel? (
          <div className="overflow-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="border px-2 py-1">Code</th><th className="border px-2 py-1">Nom</th><th className="border px-2 py-1">Ville</th></tr></thead>
              <tbody>
                {projects.map(p=>(
                  <tr key={p.project_id}><td className="border px-2 py-1">{p.code_project}</td><td className="border px-2 py-1">{p.project_name}</td><td className="border px-2 py-1">{p.city||''}</td></tr>
                ))}
                {projects.length===0 && <tr><td colSpan={3} className="border px-2 py-4 text-center text-gray-500">Aucun projet</td></tr>}
              </tbody>
            </table>
          </div>
        ): <div className="text-gray-500">Sélectionne un client ci-dessus…</div>}
      </section>
    </div>
  )
}
