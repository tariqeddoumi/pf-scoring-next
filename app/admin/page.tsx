'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type GradeBucket = { min: number; max: number; grade: string; pd: number }
type AppFlags = { show_intermediate_scores?: boolean }

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<AppFlags>({ show_intermediate_scores: false })
  const [buckets, setBuckets] = useState<GradeBucket[]>([]) // <-- pas de valeurs en dur

  useEffect(() => {
    const run = async () => {
      setLoading(true)

      // Flags
      const af = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_flags')
        .single()

      if (!af.error && af.data?.value) {
        setFlags({
          show_intermediate_scores: !!af.data.value.show_intermediate_scores,
        })
      }

      // Grade rules
      const gr = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'grade_rules')
        .single()

      if (!gr.error && gr.data?.value?.buckets) {
        setBuckets(gr.data.value.buckets as GradeBucket[])
      } else {
        // rien en base -> on laisse vide (100% DB-driven)
        setBuckets([])
      }

      setLoading(false)
    }
    run()
  }, [])

  const saveFlags = async () => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'app_flags', value: flags })
    if (error) return alert('Erreur paramètres: ' + error.message)
    alert('Paramètres enregistrés ✅')
  }

  const saveBuckets = async () => {
    // validations simples
    for (const b of buckets) {
      if (!(b.min >= 0 && b.max <= 1 && b.min < b.max)) {
        return alert('Chaque bucket: 0 ≤ min < max ≤ 1')
      }
      if (!b.grade?.trim()) return alert('Grade manquant')
      if (!(b.pd >= 0)) return alert('PD ≥ 0')
    }
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'grade_rules', value: { buckets } })
    if (error) return alert('Erreur grade_rules: ' + error.message)
    alert('Règles de grading enregistrées ✅')
  }

  const setBucket = (i: number, k: keyof GradeBucket, v: string) => {
    const next = [...buckets]
    if (k === 'grade') next[i].grade = v
    else next[i][k] = Number(v) as any
    setBuckets(next)
  }

  const addBucket = () =>
    setBuckets((b) => [...b, { min: 0.0, max: 1.0, grade: '', pd: 0 }])

  const removeBucket = (i: number) =>
    setBuckets((b) => b.filter((_, idx) => idx !== i))

  const sortBuckets = () =>
    setBuckets((b) => [...b].sort((x, y) => x.min - y.min))

  // (Optionnel) bouton pour créer un modèle par défaut EN BASE,
  // utile uniquement si tu veux “amorcer” rapidement :
  const writeDefaultBuckets = async () => {
    const defaults: GradeBucket[] = [
      { min: 0.85, max: 1.0, grade: 'A', pd: 0.002 },
      { min: 0.75, max: 0.85, grade: 'B', pd: 0.004 },
      { min: 0.65, max: 0.75, grade: 'C', pd: 0.01 },
      { min: 0.55, max: 0.65, grade: 'D', pd: 0.02 },
      { min: 0.0,  max: 0.55, grade: 'E', pd: 0.05 },
    ]
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'grade_rules', value: { buckets: defaults } })
    if (error) return alert('Erreur: ' + error.message)
    setBuckets(defaults)
    alert('Modèle par défaut chargé en base ✅')
  }

  if (loading) return <div className="p-6">Chargement…</div>

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold">Administration</h1>

      {/* === Paramètres d’application === */}
      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Paramètres d’application</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!flags.show_intermediate_scores}
            onChange={(e) =>
              setFlags((f) => ({ ...f, show_intermediate_scores: e.target.checked }))
            }
          />
          <span>Afficher les scores intermédiaires aux non-admins</span>
        </label>
        <button
          onClick={saveFlags}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Enregistrer
        </button>
      </section>

      {/* === Règles de grading === */}
      <section className="bg-white border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Règles de grading (buckets)</h2>
          {buckets.length === 0 && (
            <button
              onClick={writeDefaultBuckets}
              className="px-3 py-2 rounded border"
              title="Option facultative pour amorcer"
            >
              Charger un modèle par défaut
            </button>
          )}
        </div>

        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Min</th>
                <th className="border px-2 py-1">Max</th>
                <th className="border px-2 py-1">Grade</th>
                <th className="border px-2 py-1">PD</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">
                    <input
                      className="border rounded px-2 py-1 w-24"
                      type="number"
                      step="0.01"
                      min={0}
                      max={1}
                      value={b.min}
                      onChange={(e) => setBucket(i, 'min', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="border rounded px-2 py-1 w-24"
                      type="number"
                      step="0.01"
                      min={0}
                      max={1}
                      value={b.max}
                      onChange={(e) => setBucket(i, 'max', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="border rounded px-2 py-1 w-20"
                      value={b.grade}
                      onChange={(e) => setBucket(i, 'grade', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="border rounded px-2 py-1 w-28"
                      type="number"
                      step="0.0001"
                      min={0}
                      value={b.pd}
                      onChange={(e) => setBucket(i, 'pd', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <div className="flex gap-2">
                      <button onClick={() => removeBucket(i)} className="px-2 py-1 rounded border">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {buckets.length === 0 && (
                <tr>
                  <td colSpan={5} className="border px-2 py-3 text-center text-gray-500">
                    Aucun bucket défini. Ajoute des lignes ou utilise “Charger un modèle par défaut”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <button onClick={addBucket} className="px-3 py-2 rounded border">Ajouter un bucket</button>
          <button onClick={sortBuckets} className="px-3 py-2 rounded border">Trier par min</button>
          <button
            onClick={saveBuckets}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Enregistrer les règles
          </button>
        </div>
      </section>

      <section className="bg-white border rounded p-4">
        <h2 className="font-semibold">Gestion du modèle (paramétrage)</h2>
        <p className="text-sm text-gray-600">
          Le scoring lit directement <code>score_domains</code>, <code>score_criteria</code>, <code>score_subcriteria</code>, <code>score_options</code> et <code>app_settings</code>.
          Aucun paramètre n’est en dur. Tu peux ajouter une page dédiée (ex. <code>/admin/scoring</code>) pour le CRUD complet si tu veux administrer ces quatre tables via l’UI.
        </p>
      </section>
    </div>
  )
}
