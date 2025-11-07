'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Project = { project_id:string; project_name:string; client_id:string|null }
type Lender  = { lender_id:number; lender_name:string; is_our_bank:boolean }
type FType   = { facility_type_id:number; type_code:string; type_label:string; funded:boolean }

type FacilityDraft = {
  lender_id?: number
  facility_type_id?: number
  facility_label?: string
  approved_amount?: number|null
  currency?: string
  tenor_months?: number|null
  start_date?: string
  maturity_date?: string
  repayment_profile?: string
  first_disb?: number|null  // pour créer un cashflow initial si besoin
}

export default function CreditNew(){
  const [projects,setProjects]=useState<Project[]>([])
  const [lenders,setLenders]=useState<Lender[]>([])
  const [types,setTypes]=useState<FType[]>([])
  const [projectId,setProjectId]=useState<string>('')
  const [amountRequested,setAmountRequested]=useState<number|null>(null)
  const [currency,setCurrency]=useState<string>('MAD')
  const [requestedTenor,setRequestedTenor]=useState<number|null>(null)
  const [purpose,setPurpose]=useState<string>('')
  const [facilities,setFacilities]=useState<FacilityDraft[]>([{currency:'MAD'}])

  useEffect(()=>{(async()=>{
    const [p,l,t]=await Promise.all([
      supabase.from('projects').select('project_id,project_name,client_id').order('project_name'),
      supabase.from('lenders').select('lender_id,lender_name,is_our_bank').eq('active',true).order('is_our_bank',{ascending:false}),
      supabase.from('ref_facility_types').select('facility_type_id,type_code,type_label,funded').eq('active',true).order('type_label')
    ])
    if(!p.error&&p.data) setProjects(p.data as Project[])
    if(!l.error&&l.data) setLenders(l.data as Lender[])
    if(!t.error&&t.data) setTypes(t.data as FType[])
  })()},[])

  const addFacility=()=> setFacilities(s=>[...s,{currency:'MAD'}])
  const setF=(i:number,k:keyof FacilityDraft,v:any)=> setFacilities(s=>s.map((f,idx)=>idx===i?{...f,[k]:v}:f))
  const removeF=(i:number)=> setFacilities(s=>s.filter((_,idx)=>idx!==i))

  const save=async()=>{
    if(!projectId){ alert('Choisir un projet.'); return }
    // récup client_id du projet
    const proj=projects.find(p=>p.project_id===projectId)
    const { data: app, error: e1 } = await supabase.from('credit_applications').insert([{
      project_id: projectId,
      client_id: proj?.client_id || null,
      amount_requested: amountRequested,
      currency,
      requested_tenor_months: requestedTenor,
      purpose
    }]).select('app_id').single()
    if(e1){ alert('Erreur demande: '+e1.message); return }

    for(const f of facilities){
      const { data:fac, error:e2 } = await supabase.from('credit_facilities').insert([{
        app_id: app.app_id,
        lender_id: f.lender_id ?? null,
        facility_type_id: f.facility_type_id ?? null,
        facility_label: f.facility_label || null,
        approved_amount: f.approved_amount ?? null,
        currency: f.currency || 'MAD',
        tenor_months: f.tenor_months ?? null,
        start_date: f.start_date || null,
        maturity_date: f.maturity_date || null,
        repayment_profile: f.repayment_profile || null
      }]).select('facility_id').single()
      if(e2){ alert('Erreur facilité: '+e2.message); return }

      if(f.first_disb && f.first_disb>0){
        const { error:e3 } = await supabase.from('facility_cashflows').insert([{
          facility_id: fac.facility_id,
          cf_date: new Date().toISOString().slice(0,10),
          kind: 'DISBURSEMENT',
          amount: f.first_disb
        }])
        if(e3){ alert('Erreur cashflow initial: '+e3.message); return }
      }
    }

    alert('Demande créée ✅')
    location.href = '/credit'
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Nouvelle demande de crédit (Project Finance)</h1>

      <div className="bg-white border rounded p-4 grid md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Projet</span>
          <select className="border p-2 rounded" value={projectId} onChange={e=>setProjectId(e.target.value)}>
            <option value="">— Choisir —</option>
            {projects.map(p=><option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        </label>
        <input className="border p-2 rounded" placeholder="Objet / Purpose" value={purpose} onChange={e=>setPurpose(e.target.value)} />
        <input className="border p-2 rounded" type="number" step="0.01" placeholder="Montant global demandé" value={amountRequested??''} onChange={e=>setAmountRequested(e.target.value===''?null:Number(e.target.value))} />
        <input className="border p-2 rounded" placeholder="Devise" value={currency} onChange={e=>setCurrency(e.target.value)} />
        <input className="border p-2 rounded" type="number" placeholder="Tenor demandé (mois)" value={requestedTenor??''} onChange={e=>setRequestedTenor(e.target.value===''?null:Number(e.target.value))} />
      </div>

      <h2 className="font-semibold">Facilités</h2>
      {facilities.map((f,i)=>(
        <div key={i} className="bg-white border rounded p-4 grid md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={f.lender_id??''} onChange={e=>setF(i,'lender_id', e.target.value===''?undefined:Number(e.target.value))}>
            <option value="">— Lender —</option>
            {lenders.map(l=><option key={l.lender_id} value={l.lender_id}>{l.is_our_bank?'🏦 ':''}{l.lender_name}</option>)}
          </select>
          <select className="border p-2 rounded" value={f.facility_type_id??''} onChange={e=>setF(i,'facility_type_id', e.target.value===''?undefined:Number(e.target.value))}>
            <option value="">— Type de facilité —</option>
            {types.map(t=><option key={t.facility_type_id} value={t.facility_type_id}>{t.type_label}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Libellé" value={f.facility_label||''} onChange={e=>setF(i,'facility_label', e.target.value)} />
          <input className="border p-2 rounded" type="number" step="0.01" placeholder="Montant approuvé/demandé" value={f.approved_amount??''} onChange={e=>setF(i,'approved_amount', e.target.value===''?null:Number(e.target.value))} />
          <input className="border p-2 rounded" placeholder="Devise" value={f.currency||'MAD'} onChange={e=>setF(i,'currency', e.target.value)} />
          <input className="border p-2 rounded" type="number" placeholder="Tenor (mois)" value={f.tenor_months??''} onChange={e=>setF(i,'tenor_months', e.target.value===''?null:Number(e.target.value))} />
          <input className="border p-2 rounded" type="date" value={f.start_date||''} onChange={e=>setF(i,'start_date', e.target.value)} />
          <input className="border p-2 rounded" type="date" value={f.maturity_date||''} onChange={e=>setF(i,'maturity_date', e.target.value)} />
          <input className="border p-2 rounded" placeholder="Profil de remboursement (ANNUITY, BULLET…)" value={f.repayment_profile||''} onChange={e=>setF(i,'repayment_profile', e.target.value)} />
          <input className="border p-2 rounded" type="number" step="0.01" placeholder="Décaissement initial (optionnel)" value={f.first_disb??''} onChange={e=>setF(i,'first_disb', e.target.value===''?null:Number(e.target.value))} />
          <div className="md:col-span-3">
            <button className="px-3 py-2 border rounded" onClick={()=>removeF(i)}>Supprimer cette facilité</button>
          </div>
        </div>
      ))}
      <button className="px-3 py-2 border rounded" onClick={addFacility}>+ Ajouter une facilité</button>

      <div className="flex gap-2">
        <button className="bg-black text-white px-4 py-2 rounded" onClick={save}>Enregistrer</button>
        <a className="px-3 py-2 border rounded" href="/credit">Annuler</a>
      </div>
    </div>
  )
}
