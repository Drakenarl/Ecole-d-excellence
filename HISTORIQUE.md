# HISTORIQUE.md — Journal des versions

---

## v3.0.0 — Refonte Production (juin 2026)

**Migration complète vers MongoDB Atlas + système de rôles réels**

### Changements majeurs
- Suppression de la base de données JSON → migration vers MongoDB Atlas avec Mongoose
- Remplacement du hash SHA-256 par bcrypt (saltRounds=12) pour tous les mots de passe
- Ajout du rôle **parent** : inscription via code d'accès unique fourni par le directeur
- Refonte du système d'accès : 3 rôles distincts avec interfaces séparées dans la même SPA
- Champ `role` rendu immuable dans tous les modèles Mongoose
- Génération automatique du matricule élève (Mongoose pre-save hook)
- Suppression de `nedb-promises` (jamais vraiment utilisé)

### Nouveaux fichiers
- `backend/models/` — 7 modèles Mongoose complets
- `backend/config/db.js` — connexion MongoDB Atlas centralisée
- `backend/utils/migrate.js` — script de migration JSON → MongoDB
- `backend/models/CodeAcces.js` — codes d'accès parents
- `frontend/js/config.js` — URL API selon environnement (local / production)
- `.env.example` — toutes les variables documentées
- `CLAUDE.md`, `DEEPSEEK.md`, `HISTORIQUE.md`, `TODO.md` — documentation projet

### Routes nouvelles
- `POST /api/register-parent` — inscription parent avec code
- `GET /api/me` — profil utilisateur connecté
- `PUT /api/me/password` — changement mot de passe
- `POST /api/codes-acces` — génération de codes directeur
- `GET /api/codes-acces` — liste des codes générés

### Interface
- Dashboard adapté selon le rôle (directeur / professeur / parent)
- Interface parent : vue simplifiée avec ses enfants et leurs résultats
- Interface professeur : saisie notes par classe, absences, EDT personnel
- Interface directeur : vue globale, gestion complète
- Modale de génération de code d'accès depuis la fiche élève
- Saisie en bulk des notes pour toute une classe

---

## v2.0.0 — Restructuration Backend (mai 2026)

**Découpage du server.js monolithique en architecture modulaire**

### Changements
- `server.js` 560 lignes → découpé en `routes/`, `middleware/`, `utils/`
- Ajout de `helmet`, `dotenv`, scripts `npm start` / `npm run dev`
- `package.json` corrigé (`"main": "index.js"` → `"main": "server.js"`)
- Ajout du gestionnaire d'erreurs global (`middleware/errorHandler.js`)
- Ajout de `utils/db.js` pour la lecture/écriture JSON centralisée
- Suppression de `nedb-promises` des dépendances
- Création du `.gitignore` et du `.env.example`
- README réécrit avec installation pas-à-pas Windows/Linux/macOS

### Routes ajoutées
- `GET /api/health` — health check
- `GET /api/bulletin/:eleve_id` — bulletin complet
- `GET /api/stats/classes` — statistiques par classe

---

## v1.0.0 — Prototype initial (mai 2026)

**Proof of concept avec données générées**

### Stack
- Node.js + Express (server.js monolithique)
- Base de données : fichiers JSON générés par `seed_data.py`
- Frontend : HTML/CSS/JS Vanilla
- Authentification : JWT + hash SHA-256
- Automatisation Python : rapports, sauvegardes, alertes

### Limites (corrigées en v2/v3)
- Tout le backend dans un seul fichier de 560 lignes
- Mots de passe hashés en SHA-256 (insuffisant pour la production)
- JWT_SECRET codé en dur dans le code source
- Pas de migration possible
- Données fictives uniquement (Faker)
- Un seul rôle effectif (admin)
- Pas de système parent
