# Site Commander — APHP Paris v2

Dashboard de gestion de chantiers hospitaliers — Next.js + design Site Commander.

## Stack
- **Next.js 14** (Pages Router)
- **CSS-in-JS** (inline styles, pas de Tailwind)
- **API Routes** Next.js (serverless, pas de backend séparé)
- **Stockage** : fichier JSON local (`data/db.json`) — persistant entre redéploiements si volume configuré, sinon repart du seed à chaque cold start

## Structure

```
dashboard-chantier/
├── pages/
│   ├── index.js              # Redirect → /dashboard
│   ├── dashboard.js          # Page principale — liste des chantiers
│   ├── entreprises.js        # Liste des entreprises
│   ├── relances.js           # Gestion des relances
│   ├── chantier/[id].js      # Détail d'un chantier (zones, tâches, devis)
│   └── api/
│       ├── chantiers.js      # GET /api/chantiers
│       ├── chantiers/[id].js # GET|PUT /api/chantiers/:id
│       ├── taches.js         # GET|POST|PUT|DELETE /api/taches
│       ├── devis.js          # GET|POST /api/devis
│       ├── entreprises.js    # GET /api/entreprises
│       ├── stats.js          # GET /api/stats
│       ├── alertes.js        # GET /api/alertes
│       └── relances/
│           └── generer.js    # POST /api/relances/generer
├── components/
│   ├── Layout.js             # Header + navigation
│   └── ui.js                 # Composants partagés (StatusBadge, ProgressBar, etc.)
├── data/
│   ├── seed.js               # Données initiales (à modifier pour personnaliser)
│   └── db.json               # Base de données runtime (auto-générée)
├── lib/
│   └── db.js                 # Logique base de données en mémoire
├── styles/
│   └── globals.css           # Styles globaux + fonts Google
└── next.config.js
```

## Installation locale

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000 → redirige vers /dashboard

## Déploiement Vercel

### Option 1 : Push sur le repo existant

```bash
# Dans le repo youssefjallouli1998-dev/dashboard-chantier
# Remplace tout le contenu par ces fichiers
git add .
git commit -m "Site Commander v2 — design complet"
git push
```

Vercel redéploie automatiquement.

### Option 2 : Nouveau projet Vercel

```bash
vercel login
vercel --prod
```

### Variables d'environnement Vercel

| Nom | Valeur |
|-----|--------|
| `NEXT_PUBLIC_BASE_URL` | `https://ton-projet.vercel.app` |

## Personnaliser les données

Modifie `data/seed.js` pour changer :
- Les **chantiers** (nom, site, budget, zones)
- Les **entreprises** (nom, contact, lots)
- Les **tâches** initiales
- Les **devis** initiaux

## Pages disponibles

| URL | Description |
|-----|-------------|
| `/dashboard` | Vue d'ensemble — 10 chantiers, KPIs, filtres |
| `/chantier/:id` | Détail — zones, tâches (CRUD), devis |
| `/entreprises` | Liste accordion avec stats |
| `/relances` | Tâches en retard/bloquées + génération email |

## Fonctionnalités

- Modifier le statut d'un chantier (En cours / Bloqué / Terminé...)
- Ajouter / modifier / supprimer des tâches
- Générer un email de relance groupé par entreprise
- Filtrer les chantiers par site et statut
- Badge rouge dans la nav pour les alertes
