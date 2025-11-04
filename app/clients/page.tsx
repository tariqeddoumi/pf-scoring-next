'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Client = {
  client_id?: string
  client_name: string
  code_client: string
  code_banque: string
  nom_banque: string
  code_agence: string
  nom_agence: string
  code_groupe: string
  nom_groupe: string
  type_client: string
  taille_marche: string
  ice: string
  rc: string
  secteur: string
  adresse: string
  forme_juridique: string
}

export default function ClientsPage() {
  const [form, setForm] = useState<Partial<Client>>({})
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  const set = (k: keyof Client, v: any) => setForm((s) => ({ ...s, [k]: v }))

  const loadClients = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('clients').select('*').order('client_name')
    if (error) {
      console.error(error)
    } else {
      setClients((data || []) as Client[])
    }
    setLoading(false)
  }

  const save = async () => {
    if (!form.client_name || !form.code_client) {
      alert('Veuillez renseigner au minimum le code client et le nom.')
      return
    }
    const { error } = await supabase.from('clients').upsert(form)
    if (error) {
      alert('Erreur enregistrement: ' + error.message)
      console.error(error)
    } else {
      alert('Client enregistré avec succès ✅')
      setForm({})
      loadClients()
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Gestion des clients</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-4 rounded border">
        <input className="border p-2 rounded" placeholder="Code client" value={form.code_client || ''} onChange={(e) => set('code_client', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Nom du client" value={form.client_name || ''} onChange={(e) => set('client_name', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Code banque" value={form.code_banque || ''} onChange={(e) => set('code_banque', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Nom banque" value={form.nom_banque || ''} onChange={(e) => set('nom_banque', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Code agence" value={form.code_agence || ''} onChange={(e) => set('code_agence', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Nom agence" value={form.nom_agence || ''} onChange={(e) => set('nom_agence', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Code groupe d'affaire" value={form.code_groupe || ''} onChange={(e) => set('code_groupe', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Nom groupe d'affaire" value={form.nom_groupe || ''} onChange={(e) => set('nom_groupe', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Type de client (PME, GE...)" value={form.type_client || ''} onChange={(e) => set('type_client', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Taille/Marché" value={form.taille_marche || ''} onChange={(e) => set('taille_marche', e.target.value)} />
        <input className="border p-2 rounded" placeholder="ICE" value={form.ice || ''} onChange={(e) => set('ice', e.target.value)} />
        <input className="border p-2 rounded" placeholder="RC" value={form.rc || ''} onChange={(e) => set('rc', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Secteur d'activité" value={form.secteur || ''} onChange={(e) => set('secteur', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Adresse" value={form.adresse || ''} onChange={(e) => set('adresse', e.target.value)} />
        <input className="border p-2 rounded" placeholder="Forme juridique" value={form.forme_juridique || ''} onChange={(e) => set('forme_juridique', e.target.value)} />
      </div>

      <button onClick={save} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
        Enregistrer
      </button>

      <h2 className="text-lg font-semibold">Liste des clients</h2>
      {loading ? (
        <div>Chargement…</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Code</th>
                <th className="border px-2 py-1">Nom</th>
                <th className="border px-2 py-1">Type</th>
                <th className="border px-2 py-1">Secteur</th>
                <th className="border px-2 py-1">Taille</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.client_id || c.code_client}>
                  <td className="border px-2 py-1">{c.code_client}</td>
                  <td className="border px-2 py-1">{c.client_name}</td>
                  <td className="border px-2 py-1">{c.type_client}</td>
                  <td className="border px-2 py-1">{c.secteur}</td>
                  <td className="border px-2 py-1">{c.taille_marche}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="border px-2 py-3 text-center text-gray-500">
                    Aucun client
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
