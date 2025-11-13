'use client'
import { supabase } from '@/lib/supabase'

export default function LoginPage(){
  const signGoogle = async ()=>{
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    })
  }
  const signAzure = async ()=>{
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    })
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Connexion</h1>
      <p className="text-sm text-gray-600">L’authentification est facultative (RLS dev ouverte).</p>
      <div className="flex gap-2">
        <button onClick={signGoogle} className="px-3 py-2 rounded bg-red-600 text-white">Google</button>
        <button onClick={signAzure}  className="px-3 py-2 rounded bg-blue-700 text-white">Microsoft (Azure)</button>
      </div>
    </div>
  )
}
