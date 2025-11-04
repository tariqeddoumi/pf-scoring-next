'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Charge la session au montage et écoute les changements (login/logout)
  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      const u = data.session?.user ?? null
      setUserEmail(u?.email ?? null)
    }
    load()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUserEmail(u?.email ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async () => {
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setMsg('Erreur de connexion : ' + error.message)
    } else {
      setMsg('Connexion réussie ✅')
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setMsg(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Tu peux ajouter des metadata ici si besoin
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
    if (error) {
      setMsg('Erreur de création de compte : ' + error.message)
    } else {
      // Selon la configuration, un email de validation peut être requis
      const pending = data.user && !data.session
      setMsg(pending ? 'Compte créé. Vérifie ta boîte mail pour valider.' : 'Compte créé et connecté ✅')
    }
    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'azure') => {
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
    if (error) {
      setMsg('Erreur OAuth : ' + error.message)
      setLoading(false)
    }
    // En OAuth, l’utilisateur est redirigé. Pas besoin de setLoading(false) ici.
  }

  const handleSignOut = async () => {
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setMsg('Erreur déconnexion : ' + error.message)
    } else {
      setMsg('Déconnecté ✅')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-5">
      <h1 className="text-xl font-semibold">Connexion</h1>

      {/* Utilisateur connecté */}
      {userEmail && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <div className="mb-2">Connecté en tant que : <b>{userEmail}</b></div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-60"
          >
            Se déconnecter
          </button>
        </div>
      )}

      {/* Formulaire email / mot de passe */}
      {!userEmail && (
        <div className="space-y-3 bg-white border rounded p-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              className="border rounded px-3 py-2 w-full"
              placeholder="ex: prenom.nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Mot de passe</label>
            <input
              type="password"
              className="border rounded px-3 py-2 w-full"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-60"
            >
              Se connecter
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="px-4 py-2 rounded border disabled:opacity-60"
            >
              Créer un compte
            </button>
          </div>
        </div>
      )}

      {/* Séparateur */}
      {!userEmail && (
        <div className="flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="px-3 text-xs uppercase text-gray-500">ou</div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}

      {/* Boutons OAuth */}
      {!userEmail && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="border rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
            title="Se connecter avec Google"
          >
            Continuer avec Google
          </button>
          <button
            onClick={() => handleOAuth('azure')}
            disabled={loading}
            className="border rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
            title="Se connecter avec Microsoft (Azure)"
          >
            Continuer avec Microsoft
          </button>
        </div>
      )}

      {/* Messages */}
      {msg && (
        <div className="text-sm text-gray-700 bg-gray-50 border rounded p-3">
          {msg}
        </div>
      )}

      {/* Conseils rapides */}
      <div className="text-xs text-gray-500 bg-white border rounded p-3">
        <div className="font-semibold mb-1">À vérifier dans Supabase → Authentication → Providers :</div>
        <ul className="list-disc ml-5 space-y-1">
          <li>Active <b>Google</b> et/ou <b>Azure</b>, et configure les <i>Client ID/Secret</i>.</li>
          <li>Dans chaque provider, ajoute l’URL de redirection : <code>https://ton-projet.vercel.app</code></li>
          <li>En local (si tu testes), ajoute aussi : <code>http://localhost:3000</code></li>
        </ul>
      </div>
    </div>
  )
}
