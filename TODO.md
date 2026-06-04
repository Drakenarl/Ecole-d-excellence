# TODO.md — Ce qui reste à faire

Dernière mise à jour : juin 2026 — v3.0.0

---

## 🔴 Priorité haute (avant premier vrai usage)

- [ ] **Créer le compte directeur initial**
  Écrire et lancer `backend/utils/seed.js` pour créer le premier compte directeur en base.
  Sans ce script, personne ne peut se connecter.

- [ ] **Configurer MongoDB Atlas**
  1. Créer un compte sur https://cloud.mongodb.com
  2. Créer un cluster M0 (gratuit)
  3. Créer un utilisateur de base de données
  4. Ajouter l'IP `0.0.0.0/0` dans Network Access (ou l'IP Railway)
  5. Copier le MONGODB_URI dans `backend/.env`

- [ ] **Mettre à jour `frontend/js/config.js`**
  Remplacer `https://TON_APP.railway.app/api` par la vraie URL Railway après déploiement.

- [ ] **Configurer les classes de l'école**
  Après connexion directeur → Paramètres → renseigner les vraies classes.
  Les classes alimentent tous les formulaires (inscription élève, EDT, etc.).

- [ ] **Script `backend/utils/seed.js`**
  Créer le script qui insère le premier directeur en base avec un mot de passe temporaire.
  Format minimal :
  ```js
  await Directeur.create({ nom, prenom, email, password: 'motDePasseTemp1234', ecole: { nom: 'École Excellence', classes: [] } });
  ```

---

## 🟡 Priorité moyenne (confort d'utilisation)

- [ ] **Impression / export PDF des bulletins**
  Ajouter un bouton "Imprimer" sur la modale bulletin → `window.print()` + CSS `@media print`.

- [ ] **Saisie multi-enfants pour les parents**
  La modale code d'accès permet déjà plusieurs élèves, mais l'UI mérite d'être testée avec
  un vrai cas de famille avec 2+ enfants.

- [ ] **Filtre "Mon emploi du temps" pour les professeurs**
  Le professeur voit déjà son EDT filtré, mais ajouter un affichage par jour de la semaine
  serait plus lisible que le tableau complet.

- [ ] **Pagination sur les notes**
  Les routes `/api/notes` n'ont pas de pagination côté backend.
  À ajouter quand le volume de données augmente.

- [ ] **Recherche globale (topbar)**
  La barre de recherche en haut ne redirige que vers les élèves.
  Étendre à : professeurs, absences.

- [ ] **Notifications absences pour les parents**
  Quand une absence est enregistrée → notification visible côté parent à la prochaine connexion.

- [ ] **Photo de profil**
  Les modèles ont un champ `photo` (URL) mais l'upload n'est pas implémenté.
  À faire : endpoint `PUT /api/me/photo` + stockage (Cloudinary ou base64).

---

## 🟢 Priorité basse / Améliorations futures

- [ ] **Intégration DeepSeek** (voir DEEPSEEK.md)
  Analyse des logs de sécurité via l'API DeepSeek + collection `security_alerts`.
  Non prioritaire tant que le volume d'usage est faible.

- [ ] **CRON de rapports automatiques**
  Rapport quotidien à 18h (absences du jour) et sauvegarde hebdomadaire.
  Le code CRON était dans la v1, à réintégrer dans `server.js` avec Mongoose.

- [ ] **Scripts Python mis à jour (pymongo)**
  Les scripts `automatisation.py` et `seed_data.py` lisent encore des fichiers JSON.
  À mettre à jour pour se connecter directement à MongoDB via `pymongo`.

- [ ] **PWA (Progressive Web App)**
  Ajouter un `manifest.json` et un service worker pour permettre l'installation
  sur mobile (utile pour les parents).

- [ ] **Messagerie interne directeur → profs**
  Champ `messages` ou collection dédiée pour que le directeur puisse envoyer
  des notes internes aux professeurs.

- [ ] **Historique des modifications**
  Middleware `mongoose-history` ou champ `updated_by` pour tracer qui a modifié quoi.

- [ ] **Multi-école**
  Actuellement le système est conçu pour une école unique.
  À terme : ajouter un `ecole_id` sur tous les modèles pour une version SaaS.

- [ ] **Tests automatisés**
  Ajouter Jest + supertest pour les routes critiques (auth, notes, absences).

- [ ] **Rate limiting**
  Ajouter `express-rate-limit` sur `/api/login` (max 10 tentatives / 15min par IP).

---

## ✅ Fait en v3.0.0

- [x] Migration JSON → MongoDB Atlas
- [x] Bcrypt pour les mots de passe
- [x] 3 rôles distincts avec middlewares dédiés
- [x] Système de codes d'accès parents
- [x] Interface SPA adaptée par rôle
- [x] Bulletin scolaire avec calcul automatique des moyennes et mention
- [x] Saisie de notes en bulk pour toute une classe
- [x] Emploi du temps visuel par créneau/jour
- [x] Statistiques par classe avec barre de progression
- [x] Changement de mot de passe depuis l'interface
- [x] Paramètres de l'école (classes, nom, année scolaire)
- [x] .env.example, .gitignore, CLAUDE.md, HISTORIQUE.md, TODO.md
