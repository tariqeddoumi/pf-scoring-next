'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Client = {
  client_id?: string
  code_client: string
  client_name: string
  code_banque?: string | null
  nom_banque?: string | null
  code_agence?: string | null
  nom_agence?: string | null
  code_groupe?: string | null
  nom_groupe?: string | null
  type_client?: string | null
  taille_marche?: string | null
  ice?: string | null
  rc?: string | null
  secteur?: string | null
  adresse?: string | null
  forme_juridique?: string | null
  created_at?: string
  updated_at?: string
}

export default function ClientsPage(){
  const [list, setList] = useState<Client[]>([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<Partial<Client>>({ code_client:'', client_name:'' })
  const [selected, setSelected] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchList = async ()=>{
    setLoading(true)
    let req = supabase.from('clients').select('*').order('updated_at', { ascending: false }).limit(50)
    if (query.trim()){
      req = req.or(`code_client.ilike.%${query}%,client_name.ilike.%${query}%`)
    }
    const { data, error } = await req
    if (error) console.error(error)
    setList(data || [])
    setLoading(false)
  }

  useEffect(()=>{ fetchList() },[]) // initial
  useEffect(()=>{ const t = setTimeout(fetchList, 300); return ()=>clearTimeout(t) },[query])

  const set = (k: keyof Client, v:any)=> setForm(s=>({ ...(s||{}), [k]: v }))

  const save = async ()=>{
    if (!form.code_client || !form.client_name) {
      alert('Code client et Intitulé sont obligatoires.')
      return
    }
    const payload = { ...form }
    let res
    if (form.client_id){
      res = await supabase.from('clients').update(payload).eq('client_id', form.client_id).select().single()
    } else {
      res = await supabase.from('clients').insert(payload).select().single()
    }
    if (res.error) { alert(res.error.message); return }
    setForm({ code_client:'', client_name:'' })
    setSelected(null)
    await fetchList()
  }

  const edit = (c: Client)=>{
    setSelected(c)
    setForm(c)
  }

  const remove = async (c: Client)=>{
    if (!confirm(`Supprimer le client ${c.client_name} ? (seulement si aucun projet associé)`)) return
    const { error } = await supabase.from('clients').delete().eq('client_id', c.client_id!)
    if (error) { alert(error.message); return }
    await fetchList()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Clients</h1>

      <div className="bg-white p-3 rounded border space-y-2">
        <div className="flex gap-2">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Recherche code ou intitulé…" className="border p-2 flex-1 rounded"/>
          <button onClick={fetchList} className="px-3 py-2 rounded bg-gray-200">Actualiser</button>
        </div>
        {loading ? <div>Chargement…</div> : (
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Intitulé</th>
                <th className="p-2 text-left">Secteur</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c=>(
                <tr key={c.client_id} className="border-t">
                  <td className="p-2">{c.code_client}</td>
                  <td className="p-2">{c.client_name}</td>
                  <td className="p-2">{c.secteur || '-'}</td>
                  <td className="p-2 text-center">
                    <button onClick={()=>edit(c)} className="px-2 py-1 rounded bg-blue-600 text-white mr-2">Éditer</button>
                    <button onClick={()=>remove(c)} className="px-2 py-1 rounded bg-red-600 text-white">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white p-3 rounded border space-y-3">
        <h2 className="font-semibold">{selected ? 'Modifier le client' : 'Nouveau client'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="Code client (7)" value={form.code_client||''} onChange={e=>set('code_client',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Intitulé / Nom" value={form.client_name||''} onChange={e=>set('client_name',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Secteur" value={form.secteur||''} onChange={e=>set('secteur',e.target.value)} />
          <input className="border p-2 rounded" placeholder="ICE" value={form.ice||''} onChange={e=>set('ice',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Code banque" value={form.code_banque||''} onChange={e=>set('code_banque',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Nom banque" value={form.nom_banque||''} onChange={e=>set('nom_banque',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Code agence" value={form.code_agence||''} onChange={e=>set('code_agence',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Nom agence" value={form.nom_agence||''} onChange={e=>set('nom_agence',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Adresse" value={form.adresse||''} onChange={e=>set('adresse',e.target.value)} />
          <input className="border p-2 rounded" placeholder="Forme juridique" value={form.forme_juridique||''} onChange={e=>set('forme_juridique',e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-2 rounded bg-green-600 text-white">Enregistrer</button>
          <button onClick={()=>{setSelected(null); setForm({code_client:'',client_name:''})}} className="px-3 py-2 rounded bg-gray-200">Nouveau</button>
        </div>
      </div>
    </div>
  )
}
