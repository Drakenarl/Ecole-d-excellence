# CLAUDE.md — École Excellence v3.0.0

## 🧠 Rôle

Tu es un ingénieur fullstack senior sur le projet **École Excellence**.
Stack : Node.js + Express + MongoDB Atlas + HTML/CSS/JS Vanilla.
Tu lis ce fichier en priorité avant toute modification.

---

## 📁 Architecture du projet

```
school/
├── backend/
│   ├── server.js             # Point d'entrée
│   ├── config/db.js          # Connexion MongoDB Atlas
│   ├── models/               # Modèles Mongoose
│   │   ├── Directeur.js      # Rôle : directeur
│   │   ├── Professeur.js     # Rôle : professeur
│   │   ├── Parent.js         # Rôle : parent (lecture seule)
│   │   ├── CodeAcces.js      # Codes d'accès générés par le directeur
│   │   ├── Eleve.js          # Élève (pas un utilisateur)
│   │   ├── Note.js           # Note saisie par un professeur
│   │   ├── Absence.js        # Absence enregistrée par un professeur
│   │   └── EmploiDuTemps.js  # Créneau d'emploi du temps
│   ├── routes/
│   │   ├── auth.js           # POST /api/login, /api/register-parent, GET /api/me
│   │   ├── eleves.js         # CRUD /api/eleves
│   │   ├── notes.js          # CRUD /api/notes + GET /api/notes/bulletin/:id
│   │   ├── professeurs.js    # CRUD /api/professeurs
│   │   ├── absences.js       # CRUD /api/absences
│   │   ├── emploiDuTemps.js  # CRUD /api/emploi-du-temps
│   │   └── dashboard.js      # /api/dashboard, /api/codes-acces, /api/stats/classes, /api/parametres
│   ├── middleware/
│   │   ├── auth.js           # JWT + middlewares par rôle
│   │   └── errorHandler.js   # Gestion erreurs globale
│   └── utils/
│       └── migrate.js        # Migration JSON → MongoDB (npm run migrate)
├── frontend/
│   ├── index.html            # SPA unique
│   ├── css/style.css         # Styles complets
│   └── js/
│       ├── config.js         # API_URL selon environnement
│       └── app.js            # Application complète (JS Vanilla)
├── .env.example
├── .gitignore
├── CLAUDE.md
├── DEEPSEEK.md
├── HISTORIQUE.md
├── TODO.md
└── README.md
```

---

## 🔑 Système de rôles

| Rôle        | Accès                                                                 |
|-------------|-----------------------------------------------------------------------|
| directeur   | Tout : élèves, professeurs, notes, absences, EDT, codes, stats, params |
| professeur  | Ses notes, ses absences, son EDT                                      |
| parent      | Lecture seule : notes et absences de ses enfants uniquement           |

### Règles importantes
- Un parent s'inscrit via `POST /api/register-parent` avec un code fourni par le directeur.
- Le code est généré via `POST /api/codes-acces` et lie le parent à un ou plusieurs élèves.
- Un parent ne peut jamais voir d'autres élèves que les siens.
- Un professeur ne peut modifier que ses propres notes et absences.
- Le directeur peut tout voir et tout modifier.

---

## 🗄️ Base de données

**MongoDB Atlas** — les fichiers JSON ne sont plus utilisés.

Collections :
- `directeurs` — un seul document (le compte directeur)
- `professeurs` — un par enseignant
- `parents` — un par parent inscrit
- `codeacces` — codes d'accès générés pour les parents
- `eleves` — tous les élèves de l'école
- `notes` — une note = un élève + une matière + un trimestre
- `absences` — une absence = un élève + une date
- `emploidutempss` — créneaux semaine par classe

Tous les mots de passe sont hashés bcrypt (saltRounds=12).

---

## 📡 API — Endpoints complets

### Auth (sans token)
| Méthode | Route                  | Description                            |
|---------|------------------------|----------------------------------------|
| POST    | /api/login             | Connexion tous rôles → token JWT       |
| POST    | /api/register-parent   | Inscription parent avec code d'accès   |
| GET     | /api/health            | Statut du serveur                      |

### Auth (avec token)
| Méthode | Route            | Description                      |
|---------|------------------|----------------------------------|
| GET     | /api/me          | Profil de l'utilisateur connecté |
| PUT     | /api/me/password | Changer son mot de passe         |

### Élèves
| Méthode | Route            | Rôle               |
|---------|------------------|--------------------|
| GET     | /api/eleves      | directeur, prof, parent (filtré) |
| GET     | /api/eleves/:id  | directeur, prof, parent (vérifié) |
| POST    | /api/eleves      | directeur           |
| PUT     | /api/eleves/:id  | directeur           |
| DELETE  | /api/eleves/:id  | directeur           |

### Notes & Bulletins
| Méthode | Route                       | Rôle          |
|---------|-----------------------------|---------------|
| GET     | /api/notes                  | tous (filtré) |
| POST    | /api/notes                  | directeur, prof |
| PUT     | /api/notes/:id              | directeur, prof (le sien) |
| DELETE  | /api/notes/:id              | directeur     |
| GET     | /api/notes/bulletin/:eleveId| tous (vérifié)|

### Professeurs
| Méthode | Route                | Rôle      |
|---------|----------------------|-----------|
| GET     | /api/professeurs     | directeur, prof |
| POST    | /api/professeurs     | directeur |
| PUT     | /api/professeurs/:id | directeur, le prof lui-même |
| DELETE  | /api/professeurs/:id | directeur |

### Absences
| Méthode | Route              | Rôle          |
|---------|--------------------|---------------|
| GET     | /api/absences      | tous (filtré) |
| POST    | /api/absences      | directeur, prof |
| PUT     | /api/absences/:id  | directeur, prof (le sien) |
| DELETE  | /api/absences/:id  | directeur     |

### Emploi du temps
| Méthode | Route                       | Rôle      |
|---------|-----------------------------|-----------|
| GET     | /api/emploi-du-temps        | tous      |
| POST    | /api/emploi-du-temps        | directeur |
| PUT     | /api/emploi-du-temps/:id    | directeur |
| DELETE  | /api/emploi-du-temps/:id    | directeur |

### Codes d'accès & Dashboard
| Méthode | Route              | Rôle      |
|---------|--------------------|-----------|
| GET     | /api/dashboard     | tous (adapté par rôle) |
| POST    | /api/codes-acces   | directeur |
| GET     | /api/codes-acces   | directeur |
| DELETE  | /api/codes-acces/:id | directeur |
| GET     | /api/stats/classes | directeur, prof |
| GET     | /api/parametres    | directeur |
| PUT     | /api/parametres    | directeur |

---

## 🚀 Déploiement

1. **MongoDB Atlas** → créer cluster M0 (gratuit) → obtenir MONGODB_URI
2. **Railway** → connecter le repo GitHub → dossier `backend/` → variables d'env
3. **Netlify** → drag & drop du dossier `frontend/` → ou connecter GitHub
4. Mettre à jour `frontend/js/config.js` avec l'URL Railway
5. Mettre `CORS_ORIGIN` = URL Netlify dans les vars Railway

---

## ⚙️ Commandes

```bash
# Installation
cd backend && npm install

# Développement
npm run dev

# Production
npm start

# Migration depuis anciens fichiers JSON
npm run migrate

# Premier démarrage : créer le compte directeur
node utils/seed.js
```

---

## 🚫 Règles absolues

1. Ne jamais modifier le système de rôles sans mettre à jour ce fichier.
2. Ne jamais exposer `password` ou `password_hash` dans les réponses API.
3. Ne jamais lire/écrire les fichiers JSON comme base de données (migration faite).
4. Le champ `role` est `immutable: true` dans tous les modèles.
5. Un parent ne peut jamais accéder à un élève qui n'est pas dans sa liste `eleves`.
6. Toujours tester les middlewares `auth`, `directeurOnly`, `staffOnly` avant d'ajouter une route.
