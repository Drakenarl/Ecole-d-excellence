const express = require('express');
const jwt = require('jsonwebtoken');
const { auth, JWT_SECRET } = require('../middleware/auth');
const Directeur = require('../models/Directeur');
const Professeur = require('../models/Professeur');
const Parent = require('../models/Parent');
const CodeAcces = require('../models/CodeAcces');

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

/**
 * POST /api/login
 * Connexion pour tous les rôles (directeur, professeur, parent)
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    const emailLower = email.toLowerCase().trim();

    // Chercher dans tous les modèles
    let user = await Directeur.findOne({ email: emailLower }).select('+password');
    if (!user) user = await Professeur.findOne({ email: emailLower }).select('+password');
    if (!user) user = await Parent.findOne({ email: emailLower }).select('+password');

    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });

    const token = makeToken(user);
    res.json({
      token,
      user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/register-parent
 * Un parent s'inscrit avec le code fourni par l'école
 * Le code le lie automatiquement à ses enfants
 */
router.post('/register-parent', async (req, res, next) => {
  try {
    const { nom, prenom, email, password, telephone, code } = req.body;
    if (!nom || !prenom || !email || !password || !code) {
      return res.status(400).json({ error: 'Tous les champs sont requis (y compris le code d\'accès)' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
    }

    // Vérifier le code
    const codeDoc = await CodeAcces.findOne({ code: code.trim().toUpperCase() });
    if (!codeDoc) return res.status(400).json({ error: 'Code d\'accès invalide' });
    if (codeDoc.utilise) return res.status(400).json({ error: 'Ce code a déjà été utilisé' });
    if (new Date() > codeDoc.expire_le) return res.status(400).json({ error: 'Ce code a expiré' });

    // Vérifier email unique
    const exists = await Parent.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });

    // Créer le parent
    const parent = await Parent.create({
      nom: nom.trim(), prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      password, telephone,
      eleves: codeDoc.eleves,
      code_acces_utilise: code
    });

    // Marquer le code comme utilisé
    await CodeAcces.findByIdAndUpdate(codeDoc._id, { utilise: true, parent_id: parent._id });

    const token = makeToken(parent);
    res.status(201).json({
      token,
      user: { id: parent._id, nom: parent.nom, prenom: parent.prenom, email: parent.email, role: parent.role }
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/me
 * Retourne les infos de l'utilisateur connecté
 */
router.get('/me', auth, async (req, res, next) => {
  try {
    let user;
    if (req.user.role === 'directeur') user = await Directeur.findById(req.user.id);
    else if (req.user.role === 'professeur') user = await Professeur.findById(req.user.id);
    else user = await Parent.findById(req.user.id).populate('eleves', 'nom prenom classe matricule');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { next(err); }
});

/**
 * PUT /api/me/password
 * Changer son mot de passe
 */
router.put('/me/password', auth, async (req, res, next) => {
  try {
    const { ancien, nouveau } = req.body;
    if (!ancien || !nouveau) return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    if (nouveau.length < 6) return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères' });

    let Model;
    if (req.user.role === 'directeur') Model = Directeur;
    else if (req.user.role === 'professeur') Model = Professeur;
    else Model = Parent;

    const user = await Model.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const ok = await user.verifyPassword(ancien);
    if (!ok) return res.status(401).json({ error: 'Ancien mot de passe incorrect' });

    user.password = nouveau;
    await user.save();
    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (err) { next(err); }
});

module.exports = router;
