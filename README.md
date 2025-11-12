# ChargeTrackPro – Frontend

Interface React/Vite connectée à l'API backend.

## Usage local

```bash
npm install
cp env.example .env.local  # optionnel
# VITE_API_URL peut rester vide en local (proxy Vite -> http://127.0.0.1:5000)
npm run dev
```

## Déploiement Vercel

1. Versionner ce dossier dans un repo Git dédié (`frontend/` est la racine).
2. Importer dans Vercel (framework détecté : Vite).
3. Variables d'environnement :
   - `VITE_API_URL=https://votre-backend.vercel.app`
4. Build : `npm run build`
5. Output : `dist`

## Fichiers clés

- `src/lib/queryClient.ts` : configuration API (utilise `VITE_API_URL`)
- `src/pages/dashboard.tsx` : tableau de bord principal
- `vercel.json` : configuration Vercel (build/output)
- `env.example` : modèle d'environnement front
- `tailwind.config.ts`, `postcss.config.js` : styles

