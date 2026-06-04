const mongoose = require('mongoose');

// Codes générés par le directeur pour permettre à un parent de s'inscrire
// et être lié automatiquement à ses enfants
const codeAccesSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true },
  eleves:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Eleve', required: true }],
  utilise:   { type: Boolean, default: false },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', default: null },
  expire_le:  { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 jours
}, { timestamps: true });

module.exports = mongoose.model('CodeAcces', codeAccesSchema);
