/**
 * Seed — Création du compte directeur initial
 * Lancer depuis backend/ : node utils/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Directeur = require('../models/Directeur');

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('[ERREUR] MONGODB_URI manquant dans .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[DB] Connecté à MongoDB Atlas\n');

  const email = 'directeur@ecole.bj';
  const exists = await Directeur.findOne({ email });

  if (exists) {
    console.log(`[INFO] Le compte directeur existe déjà : ${email}`);
    console.log('       Pour réinitialiser, supprimer le document dans MongoDB Atlas.\n');
    await mongoose.disconnect();
    return;
  }

  await Directeur.create({
    nom:    'Directeur',
    prenom: 'Principal',
    email,
    password: 'direction1234',
    ecole: {
      nom:              'École Excellence',
      adresse:          'Cotonou, Bénin',
      telephone:        '',
      email:            '',
      annee_scolaire:   '2025-2026',
      systeme_notation: 20,
      classes: [
        '6ème A', '6ème B',
        '5ème A', '5ème B',
        '4ème A', '4ème B',
        '3ème A', '3ème B'
      ]
    }
  });

  console.log('✅ Compte directeur créé avec succès !');
  console.log('');
  console.log('   Email    : directeur@ecole.bj');
  console.log('   Mot de passe : direction1234');
  console.log('');
  console.log('   ⚠️  Changer le mot de passe à la première connexion.');
  console.log('      Paramètres → Mot de passe directeur\n');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('[ERREUR]', err.message);
  process.exit(1);
});
