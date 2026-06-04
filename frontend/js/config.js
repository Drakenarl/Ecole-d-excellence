// Détecte automatiquement si on est en local ou en production
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : 'https://TON_APP.railway.app/api'; // ← Remplacer par l'URL Railway après déploiement
