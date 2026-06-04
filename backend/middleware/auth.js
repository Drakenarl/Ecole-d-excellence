const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

// Directeur uniquement
function directeurOnly(req, res, next) {
  if (req.user?.role !== 'directeur') {
    return res.status(403).json({ error: 'Accès réservé au directeur' });
  }
  next();
}

// Directeur ou professeur
function staffOnly(req, res, next) {
  if (!['directeur', 'professeur'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Accès réservé au personnel de l\'école' });
  }
  next();
}

// Accès à ses propres données (parent) ou staff
function parentOrStaff(req, res, next) {
  if (!['directeur', 'professeur', 'parent'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }
  next();
}

module.exports = { auth, directeurOnly, staffOnly, parentOrStaff, JWT_SECRET };
