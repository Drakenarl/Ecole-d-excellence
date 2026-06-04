const mongoose = require('mongoose');

const eleveSchema = new mongoose.Schema({
  matricule:        { type: String, unique: true },
  nom:              { type: String, required: true, trim: true },
  prenom:           { type: String, required: true, trim: true },
  sexe:             { type: String, enum: ['M','F'], required: true },
  date_naissance:   String,
  lieu_naissance:   String,
  classe:           { type: String, required: true },
  adresse:          String,
  photo:            String,
  statut:           { type: String, enum: ['actif','inactif','exclu'], default: 'actif' },
  date_inscription: { type: String, default: () => new Date().toISOString().split('T')[0] },
  // Référence vers le compte parent (optionnel, lié via CodeAcces)
  parent:           { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', default: null }
}, { timestamps: true });

// Auto-génère le matricule avant la première sauvegarde
eleveSchema.pre('save', async function(next) {
  if (this.matricule) return next();
  const count = await mongoose.model('Eleve').countDocuments();
  const year = new Date().getFullYear();
  this.matricule = `ELV${year}${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('Eleve', eleveSchema);
