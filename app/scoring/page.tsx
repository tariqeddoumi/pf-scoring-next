'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Project = { project_id: string; code_project: string; project_name: string }
type Domain = { id:number; code:string; label:string; weight:number; order_idx:number }
type Criterion = { id:number; domain_id:number; code:string; label:string; weight:number; order_idx:number }
type SubCrit = { id:number; criterion_id:number; code:string; label:string; weight:number; order_idx:number }
type Option = { id:number; owner_kind:string; owner_id:number; value_code:string; value_label:string; score:number; order_idx:number }

export default function NewScoringPage(){
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string>('')
  const [domains, setDomains] = useState<Domain[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [subs, setSubs] = useState<SubCrit[]>([])
  const [optsByOwner, setOptsByOwner] = useState<Record<number, Option[]>>({})
  const [answers, setAnswers] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      const [p, d, c, s, o] = await Promise.all([
        supabase.from('projects').select('project_id, code_project, project_name').order('updated_at',{ascending:false}).limit(200),
        supabase.from('score_domains').select('*').eq('active', true).order('order_idx'),
        supabase.from('score_criteria').select('*').eq('active', true).order('order_idx'),
        supabase.from('score_subcriteria').select('*').eq('active', true).order('order_idx'),
        supabase.from('score_options').select('*').eq('active', true).order('order_idx')
      ])
      setProjects(p.data || [])
      setDomains(d.data || [])
      setCriteria(c.data || [])
      setSubs(s.data || [])

      const byOwner: Record<number, Option[]> = {}
      for (const row of (o.data || [])) {
        if (row.owner_kind === 'subcriterion') {
          (byOwner[row.owner_id] ||= []).push(row as any)
        }
      }
      setOptsByOwner(byOwner)
      setLoading(false)
    })()
  },[])

  const onSelect = (code:string, val:string)=>{
    setAnswers(a=>({ ...a, [code]: val }))
  }

  const grouped = useMemo(()=>{
    const critByDomain: Record<number, Criterion[]> = {}
    criteria.forEach(c=>{ (critByDomain[c.domain_id] ||= []).push(c) })
    const subByCrit: Record<number, SubCrit[]> = {}
    subs.forEach(s=>{ (subByCrit[s.criterion_id] ||= []).push(s) })
    return { critByDomain, subByCrit }
  },[criteria, subs])

  const save = async ()=>{
    if (!projectId) { alert('Choisis un projet.'); return }

    // Calcul SQL via RPC
    const { data: scoreRows, error } = await supabase.rpc('compute_project_score', {
      p_project: projectId,
      p_answers: answers as any
    })
    if (error) { alert(error.message); return }

    // agrégation grade/pd
    let finalScore = 0, grade='N/A', pd: number | null = null
    if (scoreRows && scoreRows.length) {
      const last = scoreRows[scoreRows.length-1]
      finalScore = Number(last.score_final ?? 0)
      grade = last.grade ?? 'N/A'
      pd = last.pd ?? null
    }

    const { error: insErr } = await supabase.from('evaluations').insert({
      project_id: projectId,
      score_final: finalScore,
      grade,
      pd,
      answers,
      breakdown: scoreRows
    })
    if (insErr) { alert('Erreur enregistrement: '+insErr.message); return }
    alert(`Évaluation enregistrée. Score=${finalScore.toFixed(2)}, Grade=${grade}, PD=${pd ?? ''}`)
    setAnswers({})
  }

  if (loading) return <div>Chargement…</div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Nouvelle évaluation</h1>

      <div className="bg-white p-3 rounded border space-y-2">
        <label className="block text-sm text-gray-600">Projet</label>
        <select className="border p-2 rounded w-full" value={projectId} onChange={e=>setProjectId(e.target.value)}>
          <option value="">— Choisir —</option>
          {projects.map(p=>(<option key={p.project_id} value={p.project_id}>{p.project_name} ({p.code_project})</option>))}
        </select>
      </div>

      {domains.map(d=>(
        <div key={d.id} className="bg-white p-3 rounded border space-y-3">
          <h2 className="font-semibold">{d.label} <span className="text-xs text-gray-500">(poids {d.weight})</span></h2>
          {(grouped.critByDomain[d.id] || []).map(c=>(
            <div key={c.id} className="border rounded p-3">
              <div className="font-medium mb-2">{c.label} <span className="text-xs text-gray-500">(poids {c.weight})</span></div>
              {(grouped.subByCrit[c.id] || []).map(sc=>{
                const options = optsByOwner[sc.id] || []
                return (
                  <div key={sc.id} className="flex items-center gap-2 py-1">
                    <div className="w-1/2">{sc.label} <span className="text-xs text-gray-400">(poids {sc.weight})</span></div>
                    <select
                      className="border p-2 rounded flex-1"
                      value={answers[sc.code] || ''}
                      onChange={e=>onSelect(sc.code, e.target.value)}
                    >
                      <option value="">— sélectionner —</option>
                      {options.map(o=>(
                        <option key={o.id} value={o.value_code}>{o.value_code} — {o.value_label}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ))}

      <button onClick={save} className="px-4 py-2 rounded bg-green-600 text-white">Enregistrer & Calculer</button>
    </div>
  )
}
