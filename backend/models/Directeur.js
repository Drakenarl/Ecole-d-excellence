const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const directeurSchema = new mongoose.Schema({
  nom:      { type: String, required: true, trim: true },
  prenom:   { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, default: 'directeur', immutable: true },
  telephone: String,
  photo:    String,
  ecole: {
    nom:              { type: String, default: 'École Excellence' },
    adresse:          String,
    telephone:        String,
    email:            String,
    annee_scolaire:   String,
    systeme_notation: { type: Number, default: 20 },
    devise:           { type: String, default: 'XOF' },
    classes:          [String]
  }
}, { timestamps: true });

directeurSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

directeurSchema.methods.verifyPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Directeur', directeurSchema);
