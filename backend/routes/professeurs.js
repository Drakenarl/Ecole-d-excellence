const express = require('express');
const { auth, directeurOnly, staffOnly } = require('../middleware/auth');
const Professeur = require('../models/Professeur');

const router = express.Router();

/** GET /api/professeurs — Directeur : tous | Professeur : lui-même */
router.get('/', auth, staffOnly, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'professeur') query._id = req.user.id;
    const { statut, matiere } = req.query;
    if (statut) query.statut = statut;
    if (matiere) query.matiere = matiere;
    const profs = await Professeur.find(query).sort({ nom: 1 });
    res.json(profs);
  } catch (err) { next(err); }
});

/** GET /api/professeurs/:id */
router.get('/:id', auth, staffOnly, async (req, res, next) => {
  try {
    const prof = await Professeur.findById(req.params.id);
    if (!prof) return res.status(404).json({ error: 'Professeur non trouvé' });
    res.json(prof);
  } catch (err) { next(err); }
});

/** POST /api/professeurs — Directeur uniquement */
router.post('/', auth, directeurOnly, async (req, res, next) => {
  try {
    const { nom, prenom, email, password, matiere } = req.body;
    if (!nom || !prenom || !email || !password || !matiere) {
      return res.status(400).json({ error: 'Champs requis : nom, prenom, email, password, matiere' });
    }
    const prof = await Professeur.create(req.body);
    const { password: _, ...safe } = prof.toObject();
    res.status(201).json(safe);
  } catch (err) { next(err); }
});

/** PUT /api/professeurs/:id — Directeur ou le prof lui-même */
router.put('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'directeur' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const { password, _id, role, ...updates } = req.body;
    // Le mot de passe se change via /api/me/password
    const prof = await Professeur.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!prof) return res.status(404).json({ error: 'Professeur non trouvé' });
    res.json(prof);
  } catch (err) { next(err); }
});

/** DELETE /api/professeurs/:id — Directeur uniquement */
router.delete('/:id', auth, directeurOnly, async (req, res, next) => {
  try {
    const prof = await Professeur.findByIdAndDelete(req.params.id);
    if (!prof) return res.status(404).json({ error: 'Professeur non trouvé' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
