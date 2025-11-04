'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Project = {
  project_id: string            // ID alpha-num (max 15)
  project_name: string          // Nom du projet
  project_type: string          // Type (ex: Énergie, Immobilier…)
  address: string               // Adresse du site
  region: string                // Région
  city: string                  // Ville/localité
  latitude: number | null       // Coordonnées
  longitude: number | null
  description: string           // Description
  sector: string                // Secteur (NACE/NMA)
  total_cost: number | null     // Coût total (MAD)
  financing_amount: number | null // Montant financement (MAD)
  currency: string              // Devise (par défaut MAD)
}

export default function Projects() {
  const [form, setForm] = useState<Partial<Project>>({ currency: 'MAD' })
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const set = <K extends keyof Project>(k: K, v: Project[K]) =>
    setForm((s) => ({ ...s, [k]: v }))

  const resetForm = () => setForm({ currency: 'MAD' })

  const loadProjects = async () => {
    setLoading(true)
    // Récupération basique (tu peux ajouter des filtres côté SQL si besoin)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) console.error(error)
    else setProjects((data || []) as Project[])
    setLoading(false)
  }

  const filtered = projects.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (p.project_id || '').toLowerCase().includes(q) ||
      (p.project_name || '').toLowerCase().includes(q) ||
      (p.project_type || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.region || '').toLowerCase().includes(q) ||
      (p.sector || '').toLowerCase().includes(q)
    )
  })

  const save = async () => {
    if (!form.project_id || !form.project_name) {
      alert('Veuillez renseigner au minimum: Identifiant Projet et Nom du projet.')
      return
    }
    if ((form.project_id || '').length > 15) {
      alert("Identifiant Projet: 15 caractères max.")
      return
    }
    const payload = {
      ...form,
      // Cast numériques sûrs
      latitude: form.latitude !== undefined && form.latitude !== null && form.latitude !== ('' as any)
        ? Number(form.latitude)
        : null,
      longitude: form.longitude !== undefined && form.longitude !== null && form.longitude !== ('' as any)
        ? Number(form.longitude)
        : null,
      total_cost: form.total_cost !== undefined && form.total_cost !== null && form.total_cost !== ('' as any)
        ? Number(form.total_cost)
        : null,
      financing_amount: form.financing_amount !== undefined && form.financing_amount !== null && form.financing_amount !== ('' as any)
        ? Number(form.financing_amount)
        : null,
    }

    const { error } = await supabase.from('projects').upsert(payload, { onConflict: 'project_id' })
    if (error) {
      alert('Erreur enregistrement: ' + error.message)
      console.error(error)
    } else {
      alert('Projet enregistré avec succès ✅')
      resetForm()
      loadProjects()
    }
  }

  const edit = (p: Project) => {
    setForm({
      project_id: p.project_id,
      project_name: p.project_name,
      project_type: p.project_type,
      address: p.address,
      region: p.region,
      city: p.city,
      latitude: p.latitude,
      longitude: p.longitude,
      description: p.description,
      sector: p.sector,
      total_cost: p.total_cost,
      financing_amount: p.financing_amount,
      currency: p.currency || 'MAD',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (project_id: string) => {
    if (!confirm(`Supprimer le projet ${project_id} ?`)) return
    const { error } = await supabase.from('projects').delete().eq('project_id', project_id)
    if (error) {
      alert('Suppression impossible: ' + error.message)
      console.error(error)
    } else {
      alert('Projet supprimé ✅')
      if (form.project_id === project_id) resetForm()
      loadProjects()
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Gestion des projets</h1>

      {/* Barre de recherche */}
      <div className="flex items-center gap-3">
        <input
          className="border p-2 rounded w-full md:w-1/2"
          placeholder="Rechercher (id, nom, type, ville, région, secteur)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={loadProjects}
          className="px-3 py-2 rounded border"
          title="Rafraîchir"
        >
          Rafraîchir
        </button>
      </div>

      {/* Formulaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-4 rounded border">
        <input
          className="border p-2 rounded"
          placeholder="Identifiant Projet (max 15)"
          value={form.project_id || ''}
          onChange={(e) => set('project_id', e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Nom du projet"
          value={form.project_name || ''}
          onChange={(e) => set('project_name', e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Type de projet (ex: Énergie, PPP, Immobilier)"
          value={form.project_type || ''}
          onChange={(e) => set('project_type', e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Secteur (NACE/NMA)"
          value={form.sector || ''}
          onChange={(e) => set('sector', e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Région"
          value={form.region || ''}
          onChange={(e) => set('region', e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Ville / Localité"
          value={form.city || ''}
          onChange={(e) => set('city', e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Adresse du site"
          value={form.address || ''}
          onChange={(e) => set('address', e.target.value)}
        />
        <div className="flex gap-3">
          <input
            className="border p-2 rounded w-1/2"
            placeholder="Latitude"
            type="number"
            step="0.000001"
            value={form.latitude ?? ''}
            onChange={(e) => set('latitude', e.target.value === '' ? null : Number(e.target.value))}
          />
          <input
            className="border p-2 rounded w-1/2"
            placeholder="Longitude"
            type="number"
            step="0.000001"
            value={form.longitude ?? ''}
            onChange={(e) => set('longitude', e.target.value === '' ? null : Number(e.target.value))}
          />
        </div>
        <textarea
          className="border p-2 rounded md:col-span-2"
          placeholder="Description du projet"
          rows={3}
          value={form.description || ''}
          onChange={(e) => set('description', e.target.value)}
        />
        <div className="flex gap-3">
          <input
            className="border p-2 rounded w-1/2"
            placeholder="Coût total (MAD)"
            type="number"
            step="0.01"
            value={form.total_cost ?? ''}
            onChange={(e) => set('total_cost', e.target.value === '' ? null : Number(e.target.value))}
          />
          <input
            className="border p-2 rounded w-1/2"
            placeholder="Montant financement (MAD)"
            type="number"
            step="0.01"
            value={form.financing_amount ?? ''}
            onChange={(e) => set('financing_amount', e.target.value === '' ? null : Number(e.target.value))}
          />
        </div>
        <input
          className="border p-2 rounded"
          placeholder="Devise (ex: MAD)"
          value={form.currency || 'MAD'}
          onChange={(e) => set('currency', e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Enregistrer
        </button>
        <button
          onClick={resetForm}
          className="px-4 py-2 rounded border"
        >
          Nouveau
        </button>
      </div>

      {/* Liste */}
      <h2 className="text-lg font-semibold">Liste des projets</h2>
      {loading ? (
        <div>Chargement…</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Id</th>
                <th className="border px-2 py-1">Nom</th>
                <th className="border px-2 py-1">Type</th>
                <th className="border px-2 py-1">Ville</th>
                <th className="border px-2 py-1">Région</th>
                <th className="border px-2 py-1">Secteur</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.project_id}>
                  <td className="border px-2 py-1">{p.project_id}</td>
                  <td className="border px-2 py-1">{p.project_name}</td>
                  <td className="border px-2 py-1">{p.project_type}</td>
                  <td className="border px-2 py-1">{p.city}</td>
                  <td className="border px-2 py-1">{p.region}</td>
                  <td className="border px-2 py-1">{p.sector}</td>
                  <td className="border px-2 py-1">
                    <div className="flex gap-2">
                      <button
                        onClick={() => edit(p)}
                        className="px-2 py-1 rounded border"
                        title="Éditer"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => remove(p.project_id)}
                        className="px-2 py-1 rounded border"
                        title="Supprimer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="border px-2 py-3 text-center text-gray-500">
                    Aucun projet
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
