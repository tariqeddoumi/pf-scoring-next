'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { computeTotal, resolveGrade, type GradeBucket } from '@/lib/scoring'

type Domain = { id:number; code:string; label:string; weight:number; order_idx:number }
type Criterion = { id:number; domain_id:number; code:string; label:string; weight:number; input_type:string; order_idx:number }
type Option = { id:number; criterion_id:number; value_label:string; score:number; order_idx:number }
type Project = { project_id: string; project_name: string }

export default function NewScoring(){
  const [loading, setLoading] = useState(true)
  const [domains, setDomains] = useState<Domain[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string>('')
  const [answers, setAnswers] = useState<Record<number, { type:'select'|'yesno'|'number'|'text', value:any }>>({})
  const [buckets, setBuckets] = useState<GradeBucket[]>([])

  useEffect(()=>{ (async ()=>{
    setLoading(true)
    const [d, c, o, p, s] = await Promise.all([
      supabase.from('score_domains').select('*').order('order_idx'),
      supabase.from('score_criteria').select('*').order('order_idx'),
      supabase.from('score_options').select('*').order('order_idx'),
      supabase.from('projects').select('project_id,project_name').order('created_at',{ascending:false}).limit(100),
      supabase.from('app_settings').select('value').eq('key','grade_rules').single()
    ])
    setDomains(d.data || [])
    setCriteria(c.data || [])
    setOptions(o.data || [])
    setProjects(p.data || [])
    const bs = (s.data?.value?.buckets ?? []) as GradeBucket[]
    setBuckets(bs)
    setLoading(false)
  })() },[])

  const optsByCriterion = useMemo(()=>{
    const map: Record<number, Option[]> = {}
    for (const o of options) {
      (map[o.criterion_id] ||= []).push(o)
    }
    return map
  }, [options])

  const critByDomain = useMemo(()=>{
    const map: Record<number, Criterion[]> = {}
    for (const c of criteria) {
      (map[c.domain_id] ||= []).push(c)
    }
    for (const k in map) map[k].sort((a,b)=>a.order_idx-b.order_idx)
    return map
  }, [criteria])

  const modelForCompute = useMemo(()=>{
    return domains.map(d => ({
      id:d.id, code:d.code, weight: d.weight,
      criteria: (critByDomain[d.id] || []).map(c=>{
        const a = answers[c.id]
        let s: number | null = null
        if (a?.type === 'select' || a?.type === 'yesno') {
          const opt = (optsByCriterion[c.id] || []).find(x=> String(x.id) === String(a.value))
          s = typeof opt?.score === 'number' ? opt.score : null
        } else if (a?.type === 'number') {
          const num = Number(a.value)
          if (!Number.isNaN(num)) s = Math.max(0, Math.min(1, num))
        }
        return { id:c.id, weight:c.weight, input_type:c.input_type, s }
      })
    }))
  }, [domains, critByDomain, optsByCriterion, answers])

  const { total, domainScores } = useMemo(()=> computeTotal(modelForCompute), [modelForCompute])
  const gradeInfo = useMemo(()=> resolveGrade(total, buckets || []), [total, buckets])

  const setAnswer = (criterionId:number, type: 'select'|'yesno'|'number'|'text', value:any)=>{
    setAnswers(s=> ({...s, [criterionId]: { type, value }}))
  }

  const save = async ()=>{
    if (!projectId) { alert('Choisis un projet.'); return }
    const answersPayload: Record<number, any> = {}
    for (const [k, v] of Object.entries(answers)) answersPayload[Number(k)] = v.value

    const payload = {
      project_id: projectId,
      domain_scores: domainScores,
      total_score: total,
      grade: gradeInfo.grade,
      pd: gradeInfo.pd,
      answers: answersPayload
    }
    const { error } = await supabase.from('evaluations').insert(payload)
    if (error) { alert('Erreur enregistrement: '+error.message); console.error(error); return }
    alert(Évaluation enregistrée. Score=\%, Grade=\, PD=\)
  }

  if (loading) return <div>Chargement…</div>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Nouvelle évaluation de risque</h1>

      <section className="bg-white border rounded p-3 space-y-2">
        <label className="block text-sm text-gray-600">Projet</label>
        <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="border rounded px-2 py-1 w-full">
          <option value="">— Choisir un projet —</option>
          {projects.map(p=> <option key={p.project_id} value={p.project_id}>{p.project_name} ({p.project_id})</option>)}
        </select>
      </section>

      <section className="bg-white border rounded">
        {domains.map(d=>{
          const cs = critByDomain[d.id] || []
          return (
            <div key={d.id} className="border-b last:border-none p-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{d.code} — {d.label}</h2>
                <div className="text-sm text-gray-600">Pondération domaine: <b>{d.weight}</b> | Score: <b>{(domainScores[d.code]??0).toFixed(3)}</b></div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {cs.map(c=>{
                  const a = answers[c.id]
                  const opts = optsByCriterion[c.id] || []
                  return (
                    <div key={c.id} className="border rounded p-3">
                      <div className="font-medium">{c.code} — {c.label}</div>
                      <div className="text-xs text-gray-600 mb-2">Pondération critère: <b>{c.weight}</b> | Type: {c.input_type}</div>

                      {c.input_type === 'select' && (
                        <select value={a?.value ?? ''} onChange={e=>setAnswer(c.id,'select', e.target.value)} className="border rounded px-2 py-1 w-full">
                          <option value="">— Choisir —</option>
                          {opts.map(o=> <option key={o.id} value={o.id}>{o.value_label} (score {o.score})</option>)}
                        </select>
                      )}

                      {c.input_type === 'yesno' && (
                        <select value={a?.value ?? ''} onChange={e=>setAnswer(c.id,'yesno', e.target.value)} className="border rounded px-2 py-1 w-full">
                          <option value="">— Choisir —</option>
                          {opts.map(o=> <option key={o.id} value={o.id}>{o.value_label} (score {o.score})</option>)}
                        </select>
                      )}

                      {c.input_type === 'number' && (
                        <input type="number" step="0.01" min={0} max={1} value={a?.value ?? ''} onChange={e=>setAnswer(c.id,'number', e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Score 0..1" />
                      )}

                      {c.input_type === 'text' && (
                        <input type="text" value={a?.value ?? ''} onChange={e=>setAnswer(c.id,'text', e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Note / commentaire" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      <section className="bg-white border rounded p-3">
        <div className="text-lg">
          Score total: <b>{(total*100).toFixed(1)}%</b> &nbsp; | &nbsp;
          Grade: <b>{gradeInfo.grade}</b> &nbsp; | &nbsp;
          PD: <b>{gradeInfo.pd}</b>
        </div>
        <button onClick={save} className="mt-3 px-4 py-2 rounded bg-black text-white">Enregistrer l’évaluation</button>
      </section>
    </div>
  )
}
