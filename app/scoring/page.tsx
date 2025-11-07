'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Project = {
  project_id: string
  code_project: string | null
  project_name: string | null
  client_id: string | null
}

type DomainRow = {
  id: number
  code: string
  label: string
  weight: number
  order_idx: number
  active: boolean
}

type CriterionRow = {
  id: number
  domain_id: number
  code: string
  label: string
  weight: number
  input_type: 'select' | 'yesno' | 'number' | 'text' | 'range'
  aggregation: 'sum' | 'avg' | 'max' | 'min'
  order_idx: number
  active: boolean
}

type SubcriterionRow = {
  id: number
  criterion_id: number
  code: string
  label: string
  weight: number
  input_type: 'select' | 'yesno' | 'number' | 'text' | 'range'
  order_idx: number
  active: boolean
}

type OptionRow = {
  id: number
  owner_kind: 'criterion' | 'subcriterion'
  owner_id: number
  value_code: string | null
  value_label: string
  score: number
  order_idx: number
  active: boolean
}

type ComputeRow = {
  domain_code: string
  domain_label: string
  domain_weight: number
  domain_score: number
  total_weight: number
  score_final: number
  grade: string
  pd: number
}

export default function NewScoringPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [criteria, setCriteria] = useState<CriterionRow[]>([])
  const [subcriteria, setSubcriteria] = useState<SubcriterionRow[]>([])
  const [options, setOptions] = useState<OptionRow[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{
    rows: ComputeRow[]
    score_final: number
    grade: string
    pd: number
  } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Charger référentiels + projets
  useEffect(() => {
    const run = async () => {
      setLoading(true)

      const [p, d, c, s, o, userRes] = await Promise.all([
        supabase
          .from('projects')
          .select('project_id, code_project, project_name, client_id')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('score_domains')
          .select('*')
          .eq('active', true)
          .order('order_idx'),
        supabase
          .from('score_criteria')
          .select('*')
          .eq('active', true)
          .order('order_idx'),
        supabase
          .from('score_subcriteria')
          .select('*')
          .eq('active', true)
          .order('order_idx'),
        supabase
          .from('score_options')
          .select('*')
          .eq('active', true)
          .order('order_idx'),
        supabase.auth.getUser(),
      ])

      if (!p.error && p.data) {
        setProjects(p.data as Project[])
      }
      if (!d.error && d.data) setDomains(d.data as DomainRow[])
      if (!c.error && c.data) setCriteria(c.data as CriterionRow[])
      if (!s.error && s.data) setSubcriteria(s.data as SubcriterionRow[])
      if (!o.error && o.data) setOptions(o.data as OptionRow[])

      // Déterminer si ADMIN (frontend only, pour l'affichage des détails)
      const user = userRes.data.user
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
        setIsAdmin(prof?.role === 'ADMIN')
      } else {
        setIsAdmin(false)
      }

      setLoading(false)
    }
    run()
  }, [])

  // Indexation des sous-critères & options
  const subByCriterion = useMemo(() => {
    const map: Record<number, SubcriterionRow[]> = {}
    for (const s of subcriteria) {
      if (!map[s.criterion_id]) map[s.criterion_id] = []
      map[s.criterion_id].push(s)
    }
    return map
  }, [subcriteria])

  const optsByOwner = useMemo(() => {
    const m: Record<string, OptionRow[]> = {}
    for (const row of options) {
      const key = `${row.owner_kind}:${row.owner_id}`
      if (!m[key]) m[key] = []
      m[key].push(row)
    }
    return m
  }, [options])

  const criteriaByDomain = useMemo(() => {
    const map: Record<number, CriterionRow[]> = {}
    for (const c of criteria) {
      if (!map[c.domain_id]) map[c.domain_id] = []
      map[c.domain_id].push(c)
    }
    return map
  }, [criteria])

  // Helpers
  const setAnswer = (code: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [code]: value,
    }))
  }

  const selectedProject = useMemo(
    () => projects.find((p) => p.project_id === selectedProjectId) || null,
    [projects, selectedProjectId]
  )

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      alert('Merci de sélectionner un projet.')
      return
    }

    setSaving(true)
    setResult(null)

    // Appel de la fonction SQL compute_project_score
    const { data, error } = await supabase.rpc('compute_project_score', {
      p_project: selectedProjectId,
      p_answers: answers,
    })

    if (error) {
      console.error(error)
      alert('Erreur lors du calcul du score: ' + error.message)
      setSaving(false)
      return
    }

    const rows = (data || []) as ComputeRow[]
    if (!rows.length) {
      alert(
        'Le calcul n’a retourné aucun résultat. Vérifie la configuration du modèle de scoring.'
      )
      setSaving(false)
      return
    }

    // score_final / grade / pd sont répétés sur chaque ligne, on lit la 1ère
    const sf = rows[0].score_final
    const grade = rows[0].grade
    const pd = rows[0].pd

    setResult({
      rows,
      score_final: sf,
      grade,
      pd,
    })

    // Enregistrer dans evaluations
    const clientId = selectedProject?.client_id || null
    const { error: e2 } = await supabase.from('evaluations').insert([
      {
        project_id: selectedProjectId,
        client_id: clientId,
        score_final: sf,
        grade,
        pd,
        answers, // snapshot des réponses (code -> value_code)
        breakdown: rows, // snapshot par domaine
      },
    ])

    if (e2) {
      console.error(e2)
      alert(
        'Score calculé mais erreur lors de la sauvegarde dans evaluations: ' +
          e2.message
      )
    } else {
      // ok
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="p-6">Chargement du modèle de scoring…</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Nouveau scoring projet</h1>
          <p className="text-xs text-gray-500">
            Sélectionne un projet, renseigne les critères paramétrés et laisse
            le moteur calculer Score, Grade & PD.
          </p>
        </div>
        <a
          href="/scoring"
          className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
        >
          Voir l’historique
        </a>
      </div>

      {/* Sélection projet */}
      <section className="bg-white border rounded p-4 space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Projet à scorer</span>
          <select
            className="border p-2 rounded"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">— Sélectionner un projet —</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                {p.code_project || ''} — {p.project_name || ''}
              </option>
            ))}
          </select>
        </label>
        {selectedProject && (
          <div className="text-xs text-gray-500">
            Projet sélectionné :{' '}
            <strong>{selectedProject.project_name || ''}</strong> (
            {selectedProject.code_project || ''})
          </div>
        )}
      </section>

      {/* Formulaire dynamique par domaine / critère / sous-critère */}
      <section className="bg-white border rounded p-4 space-y-4">
        {domains.length === 0 && (
          <div className="text-gray-500 text-sm">
            Aucun domaine configuré. Merci de paramétrer le modèle dans
            l’administration.
          </div>
        )}

        {domains.map((d) => (
          <div key={d.id} className="border rounded p-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">
                  {d.code} — {d.label}
                </div>
                <div className="text-[10px] text-gray-500">
                  Poids domaine (référence) :{' '}
                  {(d.weight * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {(criteriaByDomain[d.id] || []).map((c) => {
                const subs = subByCriterion[c.id] || []
                const hasSubs = subs.length > 0

                // Critère simple (sans sous-critères)
                if (!hasSubs) {
                  const opts =
                    optsByOwner[`criterion:${c.id}`] || []

                  if (c.input_type === 'select' || c.input_type === 'yesno') {
                    return (
                      <div key={c.id} className="grid md:grid-cols-2 gap-2">
                        <div className="text-xs font-medium">
                          {c.code} — {c.label}
                        </div>
                        <select
                          className="border p-2 rounded text-xs"
                          value={answers[c.code] || ''}
                          onChange={(e) =>
                            setAnswer(c.code, e.target.value)
                          }
                        >
                          <option value="">
                            — Choisir une option —
                          </option>
                          {opts.map((o) => (
                            <option
                              key={o.id}
                              value={o.value_code || o.value_label}
                            >
                              {o.value_label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  }

                  // autres types: simple champ texte/numérique (utilisable pour info ou mapping custom ultérieur)
                  return (
                    <div key={c.id} className="grid md:grid-cols-2 gap-2">
                      <div className="text-xs font-medium">
                        {c.code} — {c.label}
                      </div>
                      <input
                        className="border p-2 rounded text-xs"
                        value={answers[c.code] || ''}
                        onChange={(e) =>
                          setAnswer(c.code, e.target.value)
                        }
                        placeholder={c.input_type}
                      />
                    </div>
                  )
                }

                // Critère avec sous-critères
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="text-xs font-semibold">
                      {c.code} — {c.label}
                    </div>
                    <div className="space-y-1 pl-2 border-l">
                      {subs.map((s) => {
                        const opts =
                          optsByOwner[
                            `subcriterion:${s.id}`
                          ] || []
                        const key = s.code
                        if (
                          s.input_type === 'select' ||
                          s.input_type === 'yesno'
                        ) {
                          return (
                            <div
                              key={s.id}
                              className="grid md:grid-cols-2 gap-2"
                            >
                              <div className="text-[10px]">
                                {s.code} — {s.label}
                              </div>
                              <select
                                className="border p-2 rounded text-xs"
                                value={answers[key] || ''}
                                onChange={(e) =>
                                  setAnswer(
                                    key,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">
                                  — Choisir —
                                </option>
                                {opts.map((o) => (
                                  <option
                                    key={o.id}
                                    value={
                                      o.value_code ||
                                      o.value_label
                                    }
                                  >
                                    {o.value_label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )
                        }
                        return (
                          <div
                            key={s.id}
                            className="grid md:grid-cols-2 gap-2"
                          >
                            <div className="text-[10px]">
                              {s.code} — {s.label}
                            </div>
                            <input
                              className="border p-2 rounded text-xs"
                              value={answers[key] || ''}
                              onChange={(e) =>
                                setAnswer(
                                  key,
                                  e.target.value
                                )
                              }
                              placeholder={s.input_type}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Bouton calculer */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !selectedProjectId}
          className={`px-4 py-2 rounded text-sm ${
            saving || !selectedProjectId
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {saving ? 'Calcul en cours…' : 'Calculer le scoring'}
        </button>
      </div>

      {/* Résultat */}
      {result && (
        <section className="bg-white border rounded p-4 space-y-3">
          <h2 className="text-sm font-semibold">
            Résultat du scoring
          </h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[10px] text-gray-500">
                Score final
              </div>
              <div className="text-xl font-bold">
                {result.score_final.toFixed(3)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[10px] text-gray-500">
                Grade interne
              </div>
              <div className="text-xl font-bold">
                {result.grade}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[10px] text-gray-500">
                PD annuelle
              </div>
              <div className="text-xl font-bold">
                {(result.pd * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <div className="text-[10px] text-gray-500">
                Détail par domaine (visible uniquement pour
                ADMIN)
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-xs border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">
                        Domaine
                      </th>
                      <th className="border px-2 py-1">
                        Poids
                      </th>
                      <th className="border px-2 py-1">
                        Score domaine
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">
                          {r.domain_code} —{' '}
                          {r.domain_label}
                        </td>
                        <td className="border px-2 py-1">
                          {(r.domain_weight * 100).toFixed(
                            1
                          )}
                          %
                        </td>
                        <td className="border px-2 py-1">
                          {r.domain_score.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

