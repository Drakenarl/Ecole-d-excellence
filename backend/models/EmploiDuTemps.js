const mongoose = require('mongoose');

const emploiDuTempsSchema = new mongoose.Schema({
  classe:      { type: String, required: true },
  professeur:  { type: mongoose.Schema.Types.ObjectId, ref: 'Professeur', required: true },
  matiere:     { type: String, required: true },
  jour:        { type: String, enum: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'], required: true },
  creneau:     { type: String, required: true }, // ex: "07:30-09:30"
  salle:       String,
  annee_scolaire: { type: String, default: '2025-2026' }
}, { timestamps: true });

module.exports = mongoose.model('EmploiDuTemps', emploiDuTempsSchema);
