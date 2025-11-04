'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  computeScores,
  resolveGrade,
  type Domain,
  type Answers,
  type GradeBucket
} from '@/lib/scoring'

type ProjectRow = { project_id: string; project_name: string }

export default function NewScoringPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [projectId, setProjectId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [domains, setDomains] = useState<Domain[]>([])
  const [buckets, setBuckets] = useState<GradeBucket[]>([])
  const [answers, setAnswers] = useState<Answers>({})

  // charger référentiels (domaines/critères/sous-critères/options) + projets + grade_rules
  useEffect(() => {
    const run = async () => {
      setLoading(true)

      const [d, c, s, o, rules, projs] = await Promise.all([
        supabase.from('score_domains').select('*').eq('active', true).order('order_idx'),
        supabase.from('score_criteria').select('*').eq('active', true).order('order_idx'),
        supabase.from('score_subcriteria').select('*').eq('active', true).order('order_idx'),
        supabase.from('score_options').select('*').eq('active', true).order('order_idx'),
        supabase.from('app_settings').select('value').eq('key','grade_rules').single(),
        supabase.from('projects').select('project_id, project_name').order('created_at', { ascending: false }).limit(500)
      ])

      const subsByCrit: Record<number, any[]> = {}
      for (const row of (s.data || [])) {
        (subsByCrit[row.criterion_id] ||= []).push(row)
      }
      const optsByOwner: Record<string, any[]> = {}
      for (const row of (o.data || [])) {
        const key = row.owner_kind + ':' + row.owner_id
        (optsByOwner[key] ||= []).push(row)
      }

      const ds: Domain[] = (d.data || []).map((dom: any) => ({
        id: dom.id,
        code: dom.code,
        weight: Number(dom.weight),
        criteria: (c.data || [])
          .filter((cr: any) => cr.domain_id === dom.id)
          .map((cr: any) => {
            const sub = (subsByCrit[cr.id] || []).map((sr: any) => ({
              id: sr.id,
              code: sr.code,
              weight: Number(sr.weight),
              input_type: sr.input_type as any,
              options: (optsByOwner['subcriterion:' + sr.id] || []).map((op: any) => ({
                id: op.id,
                value_label: op.value_label,
                score: Number(op.score)
              }))
            }))
            return {
              id: cr.id,
              code: cr.code,
              weight: Number(cr.weight),
              input_type: cr.input_type as any,
              aggregation: cr.aggregation as any,
              options: (optsByOwner['criterion:' + cr.id] || []).map((op: any) => ({
                id: op.id,
                value_label: op.value_label,
                score: Number(op.score)
              })),
              subcriteria: sub
            }
          })
      }))

      setDomains(ds)
      setBuckets(((rules.data?.value?.buckets) || []) as GradeBucket[])
      setProjects(((projs.data || []) as ProjectRow[]))
      setLoading(false)
    }
    run()
  }, [])

  const setCrit = (critId: number, v: any) => {
    setAnswers((s) => ({ ...s, [critId]: { ...(s[critId] || {}), value: v } }))
  }
  const setSub = (critId: number, subId: number, v: any) => {
    setAnswers((s) => ({
      ...s,
      [critId]: {
        ...(s[critId] || {}),
        sub: { ...((s[critId] && s[critId].sub) || {}), [subId]: { value: v } }
      }
    }))
  }

  const { total, domainScores } = useMemo(() => computeScores(domains, answers), [domains, answers])
  const gradeInfo = useMemo(() => resolveGrade(total, buckets), [total, buckets])

  const save = async () => {
    if (!projectId) {
      alert('Choisis un projet.')
      return
    }
    const payload = {
      project_id: projectId,
      domain_scores: domainScores,
      total_score: total,
      grade: gradeInfo.grade,
      pd: gradeInfo.pd,
      answers: serializeAnswers(answers)
    }
    const { data, error } = await supabase.from('evaluations').insert(payload).select('id').single()
    if (error) {
      alert('Erreur enregistrement: ' + error.message)
      console.error(error)
      return
    }

    // Détail normalisé
    const rows: any[] = []
    for (const [critIdStr, aC] of Object.entries(answers)) {
      const critId = Number(critIdStr)
      if (aC?.value !== undefined) {
        const val = aC.value
        rows.push({
          evaluation_id: data.id,
          criterion_id: critId,
          option_id: isFinite(Number(val)) ? Number(val) : null,
          numeric_value: typeof val === 'number' ? val : null,
          text_value: typeof val === 'string' ? val : null
        })
      }
      if (aC?.sub) {
        for (const [subIdStr, aS] of Object.entries(aC.sub)) {
          const subId = Number(subIdStr)
          const val = (aS as any)?.value
          rows.push({
            evaluation_id: data.id,
            subcriterion_id: subId,
            option_id: isFinite(Number(val)) ? Number(val) : null,
            numeric_value: typeof val === 'number' ? val : null,
            text_value: typeof val === 'string' ? val : null
          })
        }
      }
    }
    if (rows.length) {
      const { error: e2 } = await supabase.from('evaluation_answers').insert(rows)
      if (e2) {
        console.warn('Réponses détaillées non enregistrées:', e2.message)
      }
    }

    alert(
      'Évaluation enregistrée. Score=' +
      (total * 100).toFixed(1) +
      '%, Grade=' + gradeInfo.grade +
      ', PD=' + gradeInfo.pd
    )
  }

  if (loading) return <div className="p-6">Chargement…</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Nouvelle évaluation (scoring)</h1>

      {/* Choix projet */}
      <div className="bg-white border rounded p-4">
        <label className="block text-sm text-gray-600 mb-1">Projet</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">— Choisir un projet —</option>
          {projects.map((p) => (
            <option key={p.project_id} value={p.project_id}>
              {p.project_id} — {p.project_name}
            </option>
          ))}
        </select>
      </div>

      {/* Affichage des domaines/critères/sous-critères */}
      {domains.map((d) => (
        <div key={d.id} className="bg-white border rounded p-4 space-y-3">
          <div className="font-semibold">
            {d.code} — Poids domaine = {(d.weight * 100).toFixed(0)}%
          </div>

          {d.criteria.map((c) => {
            const aC = answers[c.id]
            const hasSubs = !!(c.subcriteria && c.subcriteria.length)
            return (
              <div key={c.id} className="border rounded p-3">
                <div className="font-medium">
                  {c.code} — Poids critère = {(c.weight * 100).toFixed(0)}%
                </div>

                {!hasSubs && (
                  <div className="mt-2">
                    {c.input_type === 'select' || c.input_type === 'yesno' ? (
                      <select
                        className="border rounded px-3 py-2"
                        value={(aC && aC.value) ?? ''}
                        onChange={(e) => setCrit(c.id, e.target.value === '' ? undefined : Number(e.target.value))}
                      >
                        <option value="">— Choisir —</option>
                        {(c.options || []).map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.value_label}
                          </option>
                        ))}
                      </select>
                    ) : c.input_type === 'number' || c.input_type === 'range' ? (
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step="0.01"
                        className="border rounded px-3 py-2 w-40"
                        value={(aC && typeof aC.value !== 'undefined') ? aC.value : ''}
                        onChange={(e) => {
                          const v = e.target.value
                          setCrit(c.id, v === '' ? undefined : Number(v))
                        }}
                      />
                    ) : (
                      <input
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Texte (non noté)"
                        value={(aC && (aC as any).valueText) || ''}
                        onChange={(e) => setCrit(c.id, e.target.value)}
                      />
                    )}
                  </div>
                )}

                {hasSubs && (
                  <div className="mt-2 space-y-2">
                    {(c.subcriteria || []).map((s) => {
                      const aS = aC && aC.sub && aC.sub[s.id]
                      return (
                        <div key={s.id} className="flex items-center gap-3">
                          <div className="w-64 text-sm">
                            {s.code} — Poids {(s.weight * 100).toFixed(0)}%
                          </div>
                          {s.input_type === 'select' || s.input_type === 'yesno' ? (
                            <select
                              className="border rounded px-3 py-2"
                              value={(aS && aS.value) ?? ''}
                              onChange={(e) =>
                                setSub(c.id, s.id, e.target.value === '' ? undefined : Number(e.target.value))
                              }
                            >
                              <option value="">— Choisir —</option>
                              {(s.options || []).map((op) => (
                                <option key={op.id} value={op.id}>
                                  {op.value_label}
                                </option>
                              ))}
                            </select>
                          ) : s.input_type === 'number' || s.input_type === 'range' ? (
                            <input
                              type="number"
                              min={0}
                              max={1}
                              step="0.01"
                              className="border rounded px-3 py-2 w-40"
                              value={(aS && typeof aS.value !== 'undefined') ? aS.value : ''}
                              onChange={(e) => {
                                const v = e.target.value
                                setSub(c.id, s.id, v === '' ? undefined : Number(v))
                              }}
                            />
                          ) : (
                            <input
                              className="border rounded px-3 py-2 w-full"
                              placeholder="Texte (non noté)"
                              value={(aS && (aS as any).valueText) || ''}
                              onChange={(e) => setSub(c.id, s.id, e.target.value)}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <div className="text-sm text-gray-600">
            Score domaine {d.code} = {(domainScores[d.code] !== undefined ? domainScores[d.code] : 0).toFixed(4)}
          </div>
        </div>
      ))}

      {/* Résumé et sauvegarde */}
      <div className="bg-white border rounded p-4">
        <div className="text-lg font-semibold">
          Total: {(total * 100).toFixed(1)}% — Grade {gradeInfo.grade} — PD {gradeInfo.pd}
        </div>
        <button
          onClick={save}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 mt-3"
        >
          Enregistrer l’évaluation
        </button>
      </div>
    </div>
  )
}

function serializeAnswers(a: Answers) {
  // snapshot léger pour rechargement rapide
  const out: any = {}
  for (const [k, v] of Object.entries(a)) {
    const critId = Number(k)
    out[critId] = {}
    if (v.value !== undefined) out[critId].value = v.value
    if (v.sub) {
      out[critId].sub = {}
      for (const [sk, sv] of Object.entries(v.sub)) {
        out[critId].sub[Number(sk)] = { value: (sv as any).value }
      }
    }
  }
  return out
}
