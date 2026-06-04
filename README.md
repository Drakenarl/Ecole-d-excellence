# 🏫 École Excellence — Portail de Gestion Scolaire v3.0.0

Application web complète de gestion scolaire avec 3 espaces distincts :
directeur, professeurs et parents.

---

## 📋 Fonctionnalités par rôle

### 👑 Directeur
- Tableau de bord global : statistiques, top élèves, alertes
- Gestion complète des élèves (inscription, modification, suppression)
- Gestion des professeurs (création de compte, modification)
- Emploi du temps : créneaux par classe et professeur
- Consultation de toutes les notes et bulletins
- Suivi et justification des absences
- Génération de codes d'accès pour les parents
- Statistiques par classe avec moyennes
- Paramètres de l'école (classes, année scolaire, coordonnées)

### 👨‍🏫 Professeur
- Saisie de notes par classe et matière (saisie en bulk)
- Enregistrement des absences
- Consultation de son emploi du temps
- Visualisation des bulletins de ses élèves

### 👨‍👩‍👧 Parent
- Inscription avec code d'accès fourni par l'école
- Consultation des notes de chacun de ses enfants
- Visualisation des bulletins complets
- Suivi des absences

---

## 🗂️ Architecture

```
school/
├── backend/                  # API Node.js + Express
│   ├── server.js
│   ├── config/db.js          # Connexion MongoDB Atlas
│   ├── models/               # Mongoose : Directeur, Professeur, Parent,
│   │                         #            CodeAcces, Eleve, Note, Absence, EmploiDuTemps
│   ├── routes/               # auth, eleves, notes, professeurs, absences,
│   │                         # emploiDuTemps, dashboard
│   ├── middleware/           # auth.js (JWT + rôles), errorHandler.js
│   └── utils/migrate.js      # Migration JSON → MongoDB
│
├── frontend/                 # SPA HTML/CSS/JS Vanilla
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── config.js         # URL API selon environnement
│       └── app.js            # Application complète
│
├── .env.example
├── .gitignore
├── CLAUDE.md                 # Instructions pour l'IA
├── DEEPSEEK.md               # Intégration sécurité DeepSeek
├── HISTORIQUE.md             # Journal des versions
├── TODO.md                   # Ce qui reste à faire
└── README.md
```

---

## 🛠️ Technologies

| Couche          | Technologie                        |
|-----------------|------------------------------------|
| Backend         | Node.js 18+, Express 4             |
| Base de données | MongoDB Atlas (Mongoose 8)         |
| Auth            | JWT (8h), bcrypt (saltRounds=12)   |
| Sécurité        | Helmet, CORS                       |
| Frontend        | HTML5, CSS3, JavaScript ES6+       |
| Déploiement     | Railway (backend), Netlify (front) |

---

## 🚀 Installation depuis zéro

### Prérequis
- Node.js v18+ ([nodejs.org](https://nodejs.org))
- Un compte MongoDB Atlas ([cloud.mongodb.com](https://cloud.mongodb.com)) — gratuit

---

### Étape 1 — Récupérer le projet

```powershell
# Windows
cd C:\Users\TON_NOM\Downloads
# Dézipper school.zip, puis :
cd school
```

```bash
# Linux / macOS
cd ~/Downloads && unzip school.zip && cd school
```

---

### Étape 2 — MongoDB Atlas

1. Créer un compte sur [cloud.mongodb.com](https://cloud.mongodb.com)
2. Créer un cluster → choisir **M0 (gratuit)**
3. **Database Access** → Add new user → noter le login/mot de passe
4. **Network Access** → Add IP Address → `0.0.0.0/0` (toutes les IPs)
5. **Connect** → Drivers → copier l'URI qui ressemble à :
   ```
   mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/
   ```

---

### Étape 3 — Configuration

```powershell
# Windows
cp .env.example backend/.env
notepad backend/.env
```

```bash
# Linux / macOS
cp .env.example backend/.env
nano backend/.env
```

Remplir le fichier `backend/.env` :

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://TON_USER:TON_PASSWORD@cluster0.xxxxx.mongodb.net/ecole_excellence?retryWrites=true&w=majority
JWT_SECRET=une_longue_chaine_aleatoire_de_64_caracteres_minimum
CORS_ORIGIN=*
```

---

### Étape 4 — Installer les dépendances

```powershell
cd backend
npm install
```

---

### Étape 5 — Créer le compte directeur

Créer le fichier `backend/utils/seed.js` :

```js
require('dotenv').config();
const mongoose = require('mongoose');
const Directeur = require('../models/Directeur');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await Directeur.findOne({ email: 'directeur@ecole.bj' });
  if (exists) { console.log('Directeur déjà créé'); process.exit(0); }
  await Directeur.create({
    nom: 'Directeur', prenom: 'Principal',
    email: 'directeur@ecole.bj',
    password: 'direction1234',
    ecole: {
      nom: 'École Excellence',
      annee_scolaire: '2025-2026',
      classes: ['6ème A','6ème B','5ème A','5ème B','4ème A','3ème A']
    }
  });
  console.log('✅ Compte directeur créé : directeur@ecole.bj / direction1234');
  await mongoose.disconnect();
}
run().catch(console.error);
```

Puis lancer :
```powershell
node utils/seed.js
```

---

### Étape 6 — (Optionnel) Migrer les anciennes données JSON

Si tu as des données dans les anciens fichiers JSON :
```powershell
npm run migrate
```

---

### Étape 7 — Démarrer le serveur

```powershell
# Développement (rechargement automatique)
npm run dev

# Production
npm start
```

Résultat attendu :
```
[DB] MongoDB Atlas connecté ✅

╔══════════════════════════════════════════╗
║     🏫 École Excellence — v3.0.0         ║
╚══════════════════════════════════════════╝
  ✅ API      : http://localhost:3001/api
  ✅ Frontend : http://localhost:3001
```

---

### Étape 8 — Se connecter

Ouvrir **http://localhost:3001**

| Rôle      | Email                  | Mot de passe    |
|-----------|------------------------|-----------------|
| Directeur | directeur@ecole.bj     | direction1234   |

⚠️ Changer ce mot de passe dès la première connexion : **Paramètres → Mot de passe**

---

## 👨‍👩‍👧 Créer un compte parent

1. Le directeur se connecte
2. Aller dans **Élèves** → cliquer sur un élève → **Code parent**
3. Un code de type `A3F9B2D1` est généré (valable 30 jours)
4. Remettre ce code au parent
5. Le parent va sur l'application → **"Créer votre compte avec un code d'accès"**
6. Il remplit le formulaire avec le code → son compte est créé et lié à ses enfants

---

## 🌐 Déploiement production

### Backend → Railway

1. Pousser le projet sur GitHub
2. Aller sur [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Sélectionner le repo → choisir le dossier `backend/`
4. Dans les variables d'environnement Railway, ajouter toutes les vars du `.env`
5. Railway génère une URL du type `https://ecole-xxx.railway.app`

### Frontend → Netlify

1. Aller sur [netlify.com](https://netlify.com)
2. "Add new site" → "Deploy manually" → drag & drop le dossier `frontend/`
3. Netlify génère une URL du type `https://ecole-xxx.netlify.app`
4. Ouvrir `frontend/js/config.js` et remplacer l'URL Railway :
   ```js
   const API = window.location.hostname === 'localhost'
     ? 'http://localhost:3001/api'
     : 'https://ecole-xxx.railway.app/api'; // ← TON URL ICI
   ```
5. Redéployer le frontend sur Netlify
6. Dans Railway, mettre `CORS_ORIGIN=https://ecole-xxx.netlify.app`

---

## 🔑 Variables d'environnement

| Variable       | Description                               | Obligatoire |
|----------------|-------------------------------------------|-------------|
| `MONGODB_URI`  | URI de connexion MongoDB Atlas            | ✅          |
| `JWT_SECRET`   | Clé secrète JWT (min. 64 caractères)      | ✅          |
| `PORT`         | Port du serveur (défaut : 3001)           | ❌          |
| `NODE_ENV`     | `development` ou `production`             | ❌          |
| `CORS_ORIGIN`  | URL Netlify en prod, `*` en dev           | ❌          |

---

## 🐛 Dépannage

| Problème                              | Solution                                                  |
|---------------------------------------|-----------------------------------------------------------|
| `MONGODB_URI manquant dans .env`      | Vérifier que `backend/.env` existe et contient MONGODB_URI|
| `MongoServerError: bad auth`          | Vérifier user/password dans l'URI MongoDB                 |
| `Cannot find module 'mongoose'`       | Lancer `npm install` dans le dossier `backend/`           |
| `EADDRINUSE port 3001`                | Changer PORT dans `.env` ou fermer l'autre processus      |
| Token invalide après redémarrage      | JWT_SECRET a changé → se reconnecter                      |
| Code d'accès invalide (parent)        | Vérifier que le code n'est pas expiré (30 jours)          |
| Page blanche sur Netlify              | Vérifier l'URL dans `frontend/js/config.js`               |
| CORS error en production              | Mettre l'URL Netlify dans `CORS_ORIGIN` sur Railway        |
| `pip` non reconnu (Windows)          | Utiliser `python -m pip install faker`                    |

---

*École Excellence v3.0.0 — Node.js + MongoDB Atlas + Netlify + Railway*
