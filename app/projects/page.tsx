"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
type Project = { project_id:string; project_name:string; sector:string|null }

export default function Projects(){
  const [rows, setRows] = useState<Project[]>([])
  const [name, setName] = useState("")

  useEffect(()=>{
    supabase.from("projects").select("project_id,project_name,sector")
      .then(({data})=> setRows(data||[]))
  },[])

  const create = async ()=>{
    const id = crypto.randomUUID().replace(/-/g,"").slice(0,15).toUpperCase()
    await supabase.from("projects").insert({ project_id: id, project_name: name })
    const { data } = await supabase.from("projects").select("project_id,project_name,sector")
    setRows(data||[]); setName("")
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Projets</h1>
      <div className="flex gap-2">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom du projet" className="border px-2 py-1 rounded w-80"/>
        <button onClick={create} className="px-3 py-1 bg-black text-white rounded">Créer</button>
      </div>
      <table className="w-full border bg-white">
        <thead><tr className="text-left bg-gray-100"><th className="p-2">ID</th><th>Nom</th><th>Secteur</th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.project_id} className="border-t">
              <td className="p-2">{r.project_id}</td>
              <td className="p-2">{r.project_name}</td>
              <td className="p-2">{r.sector||"-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
