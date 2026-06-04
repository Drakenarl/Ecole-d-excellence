const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const parentSchema = new mongoose.Schema({
  nom:       { type: String, required: true, trim: true },
  prenom:    { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, select: false },
  role:      { type: String, default: 'parent', immutable: true },
  telephone: String,
  photo:     String,
  // Référence vers les élèves liés (plusieurs enfants possibles)
  eleves:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Eleve' }],
  // Code fourni par l'école lors de l'inscription
  code_acces_utilise: { type: String, select: false }
}, { timestamps: true });

parentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

parentSchema.methods.verifyPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Parent', parentSchema);
