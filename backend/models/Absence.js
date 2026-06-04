const mongoose = require('mongoose');

const absenceSchema = new mongoose.Schema({
  eleve:      { type: mongoose.Schema.Types.ObjectId, ref: 'Eleve', required: true },
  professeur: { type: mongoose.Schema.Types.ObjectId, ref: 'Professeur', required: true },
  date:       { type: String, required: true },
  cours:      String,
  motif:      { type: String, default: 'Absence non justifiée' },
  justifiee:  { type: Boolean, default: false },
  justification: String
}, { timestamps: true });

module.exports = mongoose.model('Absence', absenceSchema);
