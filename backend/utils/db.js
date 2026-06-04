/**
 * Utilitaire de lecture/écriture JSON (base de données fichiers)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

/**
 * Lit un fichier JSON depuis /data/<name>.json
 * Retourne un tableau vide si le fichier n'existe pas ou est corrompu.
 */
function readDB(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    const content = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error(`[DB] Erreur lecture ${name}.json :`, err.message);
    return [];
  }
}

/**
 * Écrit des données dans /data/<name>.json
 */
function writeDB(name, data) {
  try {
    fs.writeFileSync(
      path.join(DATA_DIR, `${name}.json`),
      JSON.stringify(data, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error(`[DB] Erreur écriture ${name}.json :`, err.message);
    throw err;
  }
}

/**
 * Génère un identifiant unique avec préfixe
 * Exemple : genId('eleve') → "eleve_1716000000000_ab3x9"
 */
function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

module.exports = { readDB, writeDB, genId };
