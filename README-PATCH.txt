# Patch PF Scoring (31-10-2025)

Fichiers à copier dans votre repo :
- lib/scoring.ts
- pp/scoring/new/page.tsx
- components/Nav.tsx (ajoute le lien Scoring vers /scoring/new)
- supabase/grade_rules_and_demo.sql (à exécuter dans Supabase → SQL Editor)

Étapes :
1) Copiez ces fichiers dans GitHub (web) aux mêmes emplacements.
2) Commit → Vercel redéploie automatiquement.
3) Dans Supabase → SQL Editor → exécutez supabase/grade_rules_and_demo.sql.
4) Ouvrez /scoring/new sur votre URL Vercel, choisissez un projet, répondez et **Enregistrer**.
