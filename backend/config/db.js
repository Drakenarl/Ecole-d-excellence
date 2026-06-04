const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[DB] MONGODB_URI manquant dans .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('[DB] MongoDB Atlas connecté ✅');
  } catch (err) {
    console.error('[DB] Échec connexion MongoDB :', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
