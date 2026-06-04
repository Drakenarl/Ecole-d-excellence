const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  eleve:       { type: mongoose.Schema.Types.ObjectId, ref: 'Eleve', required: true },
  professeur:  { type: mongoose.Schema.Types.ObjectId, ref: 'Professeur', required: true },
  matiere:     { type: String, required: true },
  note:        { type: Number, required: true, min: 0, max: 20 },
  coefficient: { type: Number, default: 1, min: 1, max: 5 },
  trimestre:   { type: String, enum: ['T1','T2','T3'], required: true },
  type:        { type: String, enum: ['Devoir surveillé','Contrôle continu','Examen'], default: 'Devoir surveillé' },
  appreciation: String,
  date:        { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
