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

export default function Clients() {
  const [form, setForm] = useState<Partial<Client>>({})
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  const set = (k: keyof Client, v: any) =>
    setForm((s) => ({ ...s, [k]: v }))

  const loadClients = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('clients').select('*').order('client_name')
    if (error) console.error(error)
    else setClients(data || [])
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
      <h1 className="text-xl font-sem
