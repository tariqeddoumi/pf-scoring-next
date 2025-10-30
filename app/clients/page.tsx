"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Client = { client_code:string; label:string; customer_type:string|null; market_size:string|null }

export default function Clients(){
  const [rows, setRows] = useState<Client[]>([])
  const [label, setLabel] = useState("")

  useEffect(()=>{
    supabase.from("clients").select("client_code,label,customer_type,market_size")
      .then(({data})=> setRows(data||[]))
  },[])

  const create = async ()=>{
    const code = crypto.randomUUID().slice(0,7).replace(/-/g,"A").toUpperCase()
    await supabase.from("clients").insert({ client_code: code, label })
    const { data } = await supabase.from("clients").select("client_code,label,customer_type,market_size")
    setRows(data||[]); setLabel("")
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Clients</h1>
      <div className="flex gap-2">
        <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Intitulé client" className="border px-2 py-1 rounded w-80"/>
        <button onClick={create} className="px-3 py-1 bg-black text-white rounded">Créer</button>
      </div>
      <table className="w-full border bg-white">
        <thead><tr className="text-left bg-gray-100"><th className="p-2">Code</th><th>Label</th><th>Type</th><th>Taille</th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.client_code} className="border-t">
              <td className="p-2">{r.client_code}</td>
              <td className="p-2">{r.label}</td>
              <td className="p-2">{r.customer_type||"-"}</td>
              <td className="p-2">{r.market_size||"-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
