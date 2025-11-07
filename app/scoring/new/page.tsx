'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type EvalRow = {
  eval_id: string
  score_final: number | null
  grade: string | null
  pd: number | null
  created_at: string
  project: {
    project_id: string
    code_project: string | null
    project_name: string | null
  } | null
  client: {
    client_id: string
    code_client: string | null
    client_name: string | null
  } | null
}

export default function ScoringListPage() {
  const [rows, setRows] = useState<EvalRow[]>([])
  const [filtered, setFiltered] = useState<EvalRow[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    // On récupère les evals avec jointure projet & client
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        eval_id,
        score_final,
        grade,
        pd,
        created_at,
        project:projects(
          project_id,
          code_project,
          project_name
        ),
        client:clients(
          client_id,
          code_client,
          client_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (!error && data) {
      const casted = data as unknown as EvalRow[]
      setRows(casted)
      setFiltered(casted)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const applyFilter = () => {
    const term = q.trim().toLowerCase()
    if (!term) {
      setFiltered(rows)
      return
    }
    setFiltered(
      rows.filter((r) => {
        const p = r.project
        const c = r.client
        return (
          (p?.code_project || '').toLowerCase().includes(term) ||
          (p?.project_name || '').toLowerCase().includes(term) ||
          (c?.code_client || '').toLowerCase().includes(term) ||
          (c?.client_name || '').toLowerCase().includes(term) ||
          (r.grade || '').toLowerCase().includes(term)
        )
      })
    )
  }

  useEffect(() => {
    applyFilter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, rows])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Scorings projets</h1>
          <p className="text-xs text-gray-500">
            Historique des notations Project Finance (grade & PD calculés à partir du modèle paramétrable).
          </p>
        </div>
        <a
          href="/scoring/new"
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
        >
          + Nouveau scoring
        </a>
      </div>

      <div className="flex gap-2">
        <input
          className="border p-2 rounded flex-1 text-sm"
          placeholder="Recherche par projet, client ou grade…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="px-3 py-2 border rounded text-sm"
          onClick={applyFilter}
        >
          Filtrer
        </button>
        <button
          className="px-3 py-2 border rounded text-sm"
          onClick={load}
        >
          Rafraîchir
        </button>
      </div>

      <div className="bg-white border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Projet</th>
              <th className="border px-2 py-1">Client</th>
              <th className="border px-2 py-1">Score</th>
              <th className="border px-2 py-1">Grade</th>
              <th className="border px-2 py-1">PD</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="border px-2 py-3 text-center text-gray-500"
                >
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="border px-2 py-3 text-center text-gray-500"
                >
                  Aucun scoring trouvé.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((r) => (
                <tr key={r.eval_id}>
                  <td className="border px-2 py-1">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="border px-2 py-1">
                    {r.project
                      ? `${r.project.code_project || ''} — ${
                          r.project.project_name || ''
                        }`
                      : ''}
                  </td>
                  <td className="border px-2 py-1">
                    {r.client
                      ? `${r.client.code_client || ''} — ${
                          r.client.client_name || ''
                        }`
                      : ''}
                  </td>
                  <td className="border px-2 py-1">
                    {r.score_final !== null
                      ? r.score_final.toFixed(3)
                      : ''}
                  </td>
                  <td className="border px-2 py-1 font-semibold">
                    {r.grade || ''}
                  </td>
                  <td className="border px-2 py-1">
                    {r.pd !== null ? (r.pd * 100).toFixed(2) + ' %' : ''}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
