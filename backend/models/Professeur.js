const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const professeurSchema = new mongoose.Schema({
  nom:           { type: String, required: true, trim: true },
  prenom:        { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, select: false },
  role:          { type: String, default: 'professeur', immutable: true },
  telephone:     String,
  photo:         String,
  matiere:       { type: String, required: true },
  classes:       [String],
  heures_semaine: Number,
  date_embauche: String,
  statut:        { type: String, enum: ['actif','inactif'], default: 'actif' }
}, { timestamps: true });

professeurSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

professeurSchema.methods.verifyPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Professeur', professeurSchema);
