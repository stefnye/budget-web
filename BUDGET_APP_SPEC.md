# Budget App — Spécification du projet

## Vue d'ensemble

Application de gestion de budget personnel composée de 3 briques (API, frontend web, app iOS), hébergée sur un homelab personnel via Docker.

---

## Architecture

```
┌─────────────────┐   ┌─────────────────┐
│   Web app (PWA)  │   │   iOS app        │
│   React + Vite   │   │   Swift/SwiftUI  │
│   Tailwind CSS   │   │   via AltStore   │
└────────┬────────┘   └────────┬────────┘
         │  REST / JSON        │
         ▼                     ▼
┌──────────────────────────────────────────┐
│          Traefik (reverse proxy + HTTPS) │
└────────────────────┬─────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    ▼                ▼                ▼
┌────────┐   ┌──────────────┐   ┌─────────┐
│Nginx   │   │  API REST    │   │  Auth   │
│(static)│   │  FastAPI     │   │  JWT    │
└────────┘   └──────┬───────┘   └─────────┘
                    │
                    ▼
             ┌──────────────┐
             │  PostgreSQL  │
             └──────────────┘

Tout dans Docker Compose sur le homelab.
Accès externe via Cloudflare Tunnel (pas de ports ouverts).
```

---

## Repos GitHub (4 repos séparés)

```
budget-api/          → Python FastAPI + Dockerfile
budget-web/          → React + Vite + Tailwind + Dockerfile
budget-ios/          → Projet Xcode (Swift/SwiftUI)
budget-infra/        → docker-compose.yml + traefik config + scripts
```

Raison : stacks différentes (Python, JS, Swift), déploiement indépendant, historiques git propres.

---

## 1. Backend — budget-api

### Stack
- Python 3.12+
- FastAPI
- SQLAlchemy (ORM) + Alembic (migrations)
- PostgreSQL 16
- Auth JWT (PyJWT)
- Pydantic pour la validation

### Structure

```
budget-api/
├── Dockerfile
├── requirements.txt
├── alembic/                  ← migrations DB
│   └── versions/
├── app/
│   ├── main.py               ← point d'entrée FastAPI, CORS
│   ├── config.py              ← settings (DATABASE_URL, JWT_SECRET depuis env)
│   ├── database.py            ← connexion SQLAlchemy
│   ├── models/                ← modèles SQLAlchemy
│   │   ├── user.py
│   │   ├── account.py
│   │   ├── category.py
│   │   ├── transaction.py
│   │   └── budget.py
│   ├── schemas/               ← schémas Pydantic (request/response)
│   │   ├── user.py
│   │   ├── transaction.py
│   │   └── budget.py
│   ├── routes/                ← endpoints groupés par domaine
│   │   ├── auth.py            ← POST /auth/register, POST /auth/login
│   │   ├── transactions.py    ← CRUD /transactions
│   │   ├── accounts.py        ← CRUD /accounts
│   │   ├── categories.py      ← CRUD /categories
│   │   ├── budgets.py         ← CRUD /budgets
│   │   └── stats.py           ← GET /stats/monthly, GET /stats/by-category
│   └── services/              ← logique métier
│       ├── auth_service.py
│       └── stats_service.py
└── tests/
```

### Schéma de base de données

```sql
users
  id              UUID PK
  email           VARCHAR UNIQUE NOT NULL
  password_hash   VARCHAR NOT NULL
  created_at      TIMESTAMP

accounts
  id              UUID PK
  user_id         UUID FK -> users
  name            VARCHAR NOT NULL        -- "Compte courant", "Livret A"
  balance         DECIMAL(12,2) DEFAULT 0
  currency        VARCHAR(3) DEFAULT 'EUR'
  created_at      TIMESTAMP

categories
  id              UUID PK
  user_id         UUID FK -> users
  name            VARCHAR NOT NULL        -- "Alimentation", "Transport"
  color           VARCHAR(7)              -- "#5DCAA5"
  icon            VARCHAR                 -- optionnel
  type            ENUM('expense','income') DEFAULT 'expense'

transactions
  id              UUID PK
  user_id         UUID FK -> users
  account_id      UUID FK -> accounts
  category_id     UUID FK -> categories (nullable)
  amount          DECIMAL(12,2) NOT NULL  -- positif = revenu, négatif = dépense
  description     VARCHAR
  date            DATE NOT NULL
  created_at      TIMESTAMP

budgets
  id              UUID PK
  user_id         UUID FK -> users
  category_id     UUID FK -> categories
  amount_limit    DECIMAL(12,2) NOT NULL  -- plafond mensuel
  month           DATE NOT NULL           -- premier jour du mois (2026-04-01)
  UNIQUE(user_id, category_id, month)
```

### Endpoints principaux

```
POST   /auth/register          → créer un compte
POST   /auth/login             → obtenir un JWT
GET    /transactions           → liste (filtres: ?month=2026-04&category_id=xxx)
POST   /transactions           → créer une transaction
PUT    /transactions/{id}      → modifier
DELETE /transactions/{id}      → supprimer
GET    /accounts               → liste des comptes
POST   /accounts               → créer un compte bancaire
GET    /categories             → liste des catégories
POST   /categories             → créer une catégorie
GET    /budgets                → budgets du mois en cours
POST   /budgets                → définir un budget pour une catégorie/mois
GET    /stats/monthly          → résumé du mois (revenus, dépenses, solde)
GET    /stats/by-category      → dépenses ventilées par catégorie
```

Toutes les routes sauf /auth/* requièrent le header `Authorization: Bearer <token>`.

---

## 2. Frontend web — budget-web

### Stack
- React 18
- Vite (build)
- Tailwind CSS
- React Router v6
- Recharts (graphiques)
- PWA via vite-plugin-pwa

### Structure

```
budget-web/
├── Dockerfile
├── nginx.conf                 ← sert les fichiers statiques
├── package.json
├── vite.config.js
├── index.html
├── public/
│   ├── icons/                 ← icônes PWA (192x192, 512x512)
│   └── manifest.json
├── src/
│   ├── main.jsx               ← point d'entrée
│   ├── App.jsx                ← routes + AuthProvider
│   ├── pages/
│   │   ├── Dashboard.jsx      ← solde, barres par catégorie, transactions récentes
│   │   ├── Transactions.jsx   ← liste complète, filtres mois/catégorie, recherche
│   │   ├── Budgets.jsx        ← budget par catégorie, barres de progression
│   │   └── Settings.jsx       ← comptes, catégories, profil
│   ├── components/
│   │   ├── Layout.jsx         ← navbar + <Outlet>
│   │   ├── MetricCard.jsx     ← carte solde/dépenses/revenus
│   │   ├── TransactionRow.jsx
│   │   ├── CategoryBar.jsx    ← barre de progression
│   │   ├── AddTransactionModal.jsx
│   │   └── MonthPicker.jsx
│   ├── hooks/
│   │   ├── useApi.js          ← wrapper fetch + JWT auto
│   │   └── useAuth.js         ← login, logout, token storage
│   └── services/
│       └── api.js             ← fonctions: getTransactions(), createTransaction(), etc.
└── .env.example               ← VITE_API_URL=https://api.mondomaine.fr
```

### Pages du dashboard

Le dashboard affiche :
- 3 cartes métriques : solde total, dépenses du mois, revenus du mois
- Barre de progression du budget mensuel global (% consommé)
- Dépenses par catégorie (barres horizontales colorées)
- 5 dernières transactions

### Configuration PWA

Fichier `manifest.json` :
```json
{
  "name": "Mon Budget",
  "short_name": "Budget",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1D9E75",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Meta tags dans `index.html` :
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

Le plugin `vite-plugin-pwa` génère le service worker automatiquement.

### Communication API

Le hook `useApi` :
- Ajoute `Authorization: Bearer <token>` à chaque requête
- Redirige vers /login si le token expire (401)
- URL de base depuis `VITE_API_URL`

---

## 3. App iOS — budget-ios

### Stack
- Swift 5.9+
- SwiftUI
- Architecture MVVM
- URLSession pour les appels API
- Keychain pour stocker le JWT

### Structure

```
budget-ios/
└── BudgetApp/
    ├── BudgetApp.xcodeproj
    ├── BudgetApp/
    │   ├── BudgetAppApp.swift       ← point d'entrée @main
    │   ├── Config.swift              ← URL de l'API
    │   ├── Models/
    │   │   ├── User.swift
    │   │   ├── Account.swift
    │   │   ├── Transaction.swift
    │   │   ├── Category.swift
    │   │   └── Budget.swift
    │   ├── Views/
    │   │   ├── DashboardView.swift   ← vue principale
    │   │   ├── TransactionListView.swift
    │   │   ├── AddTransactionView.swift
    │   │   ├── BudgetView.swift
    │   │   └── LoginView.swift
    │   ├── ViewModels/
    │   │   ├── DashboardViewModel.swift
    │   │   ├── TransactionViewModel.swift
    │   │   └── AuthViewModel.swift
    │   └── Services/
    │       ├── APIClient.swift       ← appels HTTP vers l'API
    │       └── KeychainHelper.swift  ← stockage sécurisé du JWT
    └── BudgetAppTests/
```

### Distribution via AltStore

1. Compiler dans Xcode → exporter un fichier `.ipa`
2. Sur le Mac : installer AltServer (tourne en tâche de fond)
3. Sur l'iPhone : installer AltStore via AltServer (USB la première fois)
4. Ouvrir AltStore → My Apps → "+" → sélectionner le `.ipa`
5. Renouvellement automatique des 7 jours si le Mac est allumé + même réseau Wi-Fi

Alternative : SideStore (fork d'AltStore) permet le renouvellement directement depuis l'iPhone via WireGuard, sans que le Mac soit allumé en permanence.

---

## 4. Infrastructure — budget-infra

### Structure

```
budget-infra/
├── docker-compose.yml
├── .env.example
├── traefik/
│   ├── traefik.yml            ← config Traefik
│   └── acme.json              ← certificats Let's Encrypt (auto-généré)
└── scripts/
    ├── backup-db.sh           ← pg_dump automatique
    └── deploy.sh              ← git pull + docker compose up --build
```

### docker-compose.yml

```yaml
services:
  traefik:
    image: traefik:v3
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik:/etc/traefik
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: budget
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
    restart: unless-stopped

  api:
    build:
      context: ../budget-api
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASS}@db:5432/budget
      JWT_SECRET: ${JWT_SECRET}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.mondomaine.fr`)"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
    restart: unless-stopped

  web:
    build:
      context: ../budget-web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`budget.mondomaine.fr`)"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
    restart: unless-stopped

volumes:
  db_data:
```

### Accès externe

Option recommandée : Cloudflare Tunnel (pas de ports ouverts sur le routeur).

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${CF_TUNNEL_TOKEN}
    restart: unless-stopped
```

Alternative : ouvrir les ports 80/443 sur le routeur + redirection vers le homelab + Let's Encrypt via Traefik.

### .env.example

```env
DB_USER=budget_user
DB_PASS=changeme_strong_password
JWT_SECRET=changeme_random_64_chars
CF_TUNNEL_TOKEN=your_cloudflare_tunnel_token
```

---

## Ordre de développement recommandé

### Phase 1 — API de base
1. Initialiser le repo `budget-api`
2. Créer les modèles SQLAlchemy + migration Alembic initiale
3. Implémenter l'auth (register/login + JWT)
4. CRUD transactions, comptes, catégories
5. Endpoints stats (résumé mensuel, ventilation par catégorie)
6. Écrire le Dockerfile

### Phase 2 — Frontend web
1. Initialiser le repo `budget-web` avec Vite + React + Tailwind
2. Page login + hook useAuth
3. Dashboard avec les 3 cartes métriques + barres par catégorie
4. Page transactions (liste + ajout + filtres)
5. Page budgets (définir plafonds + progression)
6. Configurer la PWA (manifest + service worker)
7. Écrire le Dockerfile + nginx.conf

### Phase 3 — Infrastructure
1. Initialiser le repo `budget-infra`
2. Écrire le docker-compose.yml
3. Configurer Traefik + HTTPS
4. Configurer Cloudflare Tunnel (ou ouvrir les ports)
5. Script de backup PostgreSQL (cron)
6. Déployer sur le homelab

### Phase 4 — App iOS
1. Initialiser le repo `budget-ios` dans Xcode
2. Créer les modèles Swift (miroir des schémas API)
3. APIClient.swift (appels HTTP + JWT via Keychain)
4. DashboardView (solde, dernières transactions)
5. TransactionListView + AddTransactionView
6. Compiler et installer via AltStore

---

## Notes techniques

### Authentification
- JWT avec expiration courte (15 min) + refresh token (7 jours)
- Le refresh token est stocké en httpOnly cookie côté web, en Keychain côté iOS
- L'access token est envoyé dans le header Authorization

### CORS
L'API doit autoriser les origines :
- `https://budget.mondomaine.fr` (frontend web)
- Requêtes depuis l'app iOS (pas de restriction d'origine pour les apps natives)

### Base de données
- PostgreSQL 16 dans Docker avec un volume persistant
- Backup quotidien via pg_dump (script cron sur le homelab)
- Les montants sont stockés en DECIMAL(12,2), jamais en float

### PWA vs app native
La PWA couvre 90% des besoins (consultation, ajout de transactions). L'app iOS apporte : un meilleur accès offline, les notifications, les widgets, et une UX plus fluide. Commencer par la PWA, ajouter l'app iOS en phase 4.
