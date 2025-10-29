# PF Scoring — Next.js + Supabase (Starter)

## Démarrer en local
1. `cp .env.local.example .env.local` et renseigner :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. `npm install`
3. `npm run dev`
4. Exécuter `supabase/schema.sql` dans Supabase (SQL Editor).

## Déployer (Vercel)
- Ajouter les 2 variables d'env dans Project → Settings → Environment Variables.
- Déployer.
