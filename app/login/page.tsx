"use client"
import { supabase } from "@/lib/supabaseClient"

export default function Login(){
  const signin = async (provider: "google"|"azure")=>{
    await supabase.auth.signInWithOAuth({ provider: provider==="google"?"google":"azure" })
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Connexion</h1>
      <button onClick={()=>signin("google")} className="px-4 py-2 rounded bg-black text-white">Google</button>
      <button onClick={()=>signin("azure")} className="px-4 py-2 rounded bg-gray-800 text-white">Microsoft</button>
    </div>
  )
}
