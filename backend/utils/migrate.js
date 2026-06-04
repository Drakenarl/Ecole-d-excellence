/**
 * Migration JSON → MongoDB
 * Lancer depuis le dossier backend/ : node utils/migrate.js
 * Les fichiers JSON doivent être dans ../data/
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const Directeur   = require('../models/Directeur');
const Professeur  = require('../models/Professeur');
const Eleve       = require('../models/Eleve');
const Note        = require('../models/Note');
const Absence     = require('../models/Absence');
const EmploiDuTemps = require('../models/EmploiDuTemps');

const DATA = path.join(__dirname, '../../data');

function readJSON(name) {
  const file = path.join(DATA, `${name}.json`);
  if (!fs.existsSync(file)) { console.log(`[SKIP] ${name}.json absent`); return []; }
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[DB] Connecté\n');

  // ── DIRECTEUR ──────────────────────────────────────────────
  const admins = readJSON('admin');
  for (const a of admins) {
    const exists = await Directeur.findOne({ email: a.email });
    if (exists) { console.log(`[SKIP] Directeur ${a.email} existe déjà`); continue; }
    const password = await bcrypt.hash('admin1234', 12); // mot de passe par défaut à changer
    await Directeur.create({
      nom: a.nom, prenom: a.prenom, email: a.email,
      password, ecole: a.ecole
    });
    console.log(`[OK] Directeur : ${a.email}`);
  }

  // ── PROFESSEURS ────────────────────────────────────────────
  const profs = readJSON('professeurs');
  const profMap = {}; // ancien _id JSON → nouvel ObjectId Mongo
  for (const p of profs) {
    const exists = await Professeur.findOne({ email: p.email });
    if (exists) { profMap[p._id] = exists._id; console.log(`[SKIP] Prof ${p.email}`); continue; }
    const password = await bcrypt.hash('prof1234', 12);
    const created = await Professeur.create({
      nom: p.nom, prenom: p.prenom, email: p.email, password,
      matiere: p.matiere, classes: p.classes || [],
      heures_semaine: p.heures_semaine, date_embauche: p.date_embauche,
      statut: p.statut || 'actif'
    });
    profMap[p._id] = created._id;
    console.log(`[OK] Professeur : ${p.email}`);
  }

  // ── ÉLÈVES ─────────────────────────────────────────────────
  const eleves = readJSON('eleves');
  const eleveMap = {}; // ancien _id JSON → nouvel ObjectId Mongo
  for (const e of eleves) {
    const exists = await Eleve.findOne({ matricule: e.matricule });
    if (exists) { eleveMap[e._id] = exists._id; console.log(`[SKIP] Élève ${e.matricule}`); continue; }
    const created = await Eleve.create({
      matricule: e.matricule, nom: e.nom, prenom: e.prenom,
      sexe: e.sexe || 'M', date_naissance: e.date_naissance,
      lieu_naissance: e.lieu_naissance, classe: e.classe,
      adresse: e.adresse, statut: e.statut || 'actif',
      date_inscription: e.date_inscription
    });
    eleveMap[e._id] = created._id;
    console.log(`[OK] Élève : ${e.matricule} ${e.nom}`);
  }

  // ── NOTES ──────────────────────────────────────────────────
  const notes = readJSON('notes');
  let notesOk = 0;
  for (const n of notes) {
    const eleveId = eleveMap[n.eleve_id];
    const profId = profMap[n.prof_id] || Object.values(profMap)[0]; // fallback
    if (!eleveId) { console.log(`[SKIP] Note sans élève : ${n.eleve_id}`); continue; }
    await Note.create({
      eleve: eleveId, professeur: profId,
      matiere: n.matiere, note: n.note,
      coefficient: n.coefficient || 1,
      trimestre: n.trimestre || 'T1',
      type: n.type || 'Devoir surveillé',
      appreciation: n.appreciation || '',
      date: n.date
    });
    notesOk++;
  }
  console.log(`[OK] ${notesOk} notes migrées`);

  // ── ABSENCES ───────────────────────────────────────────────
  const absences = readJSON('absences');
  let absOk = 0;
  for (const a of absences) {
    const eleveId = eleveMap[a.eleve_id];
    const profId = profMap[a.prof_id] || Object.values(profMap)[0];
    if (!eleveId) continue;
    await Absence.create({
      eleve: eleveId, professeur: profId,
      date: a.date, cours: a.cours, motif: a.motif || '',
      justifiee: a.justifiee || false
    });
    absOk++;
  }
  console.log(`[OK] ${absOk} absences migrées`);

  // ── EMPLOI DU TEMPS ────────────────────────────────────────
  const edt = readJSON('emploi_du_temps');
  let edtOk = 0;
  for (const e of edt) {
    const profId = profMap[e.prof_id] || Object.values(profMap)[0];
    if (!profId) continue;
    await EmploiDuTemps.create({
      classe: e.classe, professeur: profId,
      matiere: e.matiere, jour: e.jour,
      creneau: e.creneau || e.heure_debut + '-' + e.heure_fin,
      salle: e.salle
    });
    edtOk++;
  }
  console.log(`[OK] ${edtOk} créneaux EDT migrés`);

  console.log('\n✅ Migration terminée.');
  console.log('⚠️  Mots de passe par défaut : admin → admin1234, profs → prof1234');
  console.log('   Chaque utilisateur doit changer son mot de passe à la première connexion.\n');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
