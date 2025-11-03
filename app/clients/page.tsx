// ...imports
type Client = {
  client_code:string; bank_code:string|null; bank_name:string|null;
  branch_code:string|null; branch_name:string|null;
  group_code:string|null; group_name:string|null;
  label:string; customer_type:string|null; market_size:string|null;
  identifiers:any; sector_code:string|null; legal_form:string|null; hq_address:string|null
}

export default function Clients(){
  // champs
  const [form, setForm] = useState<Partial<Client>>({ identifiers: {} })
  const set = (k:string, v:any)=> setForm(s=>({...s,[k]:v}))

  const create = async ()=>{
    const code = crypto.randomUUID().replace(/-/g,'').slice(0,7).toUpperCase()
    const payload = { client_code: code, ...form }
    const { error } = await supabase.from('clients').insert(payload)
    if (error) { alert('Erreur: '+error.message); return }
    alert('Client créé: '+code); location.reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Clients</h1>

      <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded border">
        <input className="border px-2 py-1 rounded" placeholder="Intitulé client" onChange={e=>set('label', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Type client" onChange={e=>set('customer_type', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Taille/Marché (TPE/PME/GE)" onChange={e=>set('market_size', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Secteur (NMA/NACE)" onChange={e=>set('sector_code', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Forme juridique" onChange={e=>set('legal_form', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Adresse siège" onChange={e=>set('hq_address', e.target.value)} />

        <input className="border px-2 py-1 rounded" placeholder="Code banque" onChange={e=>set('bank_code', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Nom banque" onChange={e=>set('bank_name', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Code agence" onChange={e=>set('branch_code', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Nom agence" onChange={e=>set('branch_name', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Code groupe d'affaires" onChange={e=>set('group_code', e.target.value)} />
        <input className="border px-2 py-1 rounded" placeholder="Nom groupe d'affaires" onChange={e=>set('group_name', e.target.value)} />

        <input className="border px-2 py-1 rounded" placeholder="ICE" onChange={e=>set('identifiers', {...form.identifiers, ICE: e.target.value})} />
        <input className="border px-2 py-1 rounded" placeholder="IS" onChange={e=>set('identifiers', {...form.identifiers, IS: e.target.value})} />
        <input className="border px-2 py-1 rounded" placeholder="RC" onChange={e=>set('identifiers', {...form.identifiers, RC: e.target.value})} />
      </div>

      <button onClick={create} className="px-4 py-2 rounded bg-black text-white">Créer</button>
    </div>
  )
}
