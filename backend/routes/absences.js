const express = require('express');
const { auth, staffOnly, directeurOnly } = require('../middleware/auth');
const Absence = require('../models/Absence');
const Eleve = require('../models/Eleve');

const router = express.Router();

/** GET /api/absences */
router.get('/', auth, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'professeur') query.professeur = req.user.id;
    if (req.user.role === 'parent') {
      const Parent = require('../models/Parent');
      const parent = await Parent.findById(req.user.id);
      query.eleve = { $in: parent?.eleves || [] };
    }

    const { eleve, classe, justifiee } = req.query;
    if (eleve) query.eleve = eleve;
    if (justifiee !== undefined) query.justifiee = justifiee === 'true';
    if (classe) {
      const eleves = await Eleve.find({ classe }).select('_id');
      query.eleve = { $in: eleves.map(e => e._id) };
    }

    const absences = await Absence.find(query)
      .populate('eleve', 'nom prenom classe matricule')
      .populate('professeur', 'nom prenom')
      .sort({ date: -1 });

    res.json(absences);
  } catch (err) { next(err); }
});

/** POST /api/absences — Staff seulement */
router.post('/', auth, staffOnly, async (req, res, next) => {
  try {
    if (!req.body.eleve) return res.status(400).json({ error: 'Champ requis : eleve' });
    const absence = await Absence.create({
      ...req.body,
      professeur: req.body.professeur || req.user.id,
      date: req.body.date || new Date().toISOString().split('T')[0]
    });
    res.status(201).json(absence);
  } catch (err) { next(err); }
});

/** PUT /api/absences/:id — Justifier ou modifier */
router.put('/:id', auth, staffOnly, async (req, res, next) => {
  try {
    const absence = await Absence.findById(req.params.id);
    if (!absence) return res.status(404).json({ error: 'Absence non trouvée' });
    if (req.user.role === 'professeur' && String(absence.professeur) !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos absences' });
    }
    const { _id, eleve, professeur, ...updates } = req.body;
    Object.assign(absence, updates);
    await absence.save();
    res.json(absence);
  } catch (err) { next(err); }
});

/** DELETE /api/absences/:id — Directeur uniquement */
router.delete('/:id', auth, directeurOnly, async (req, res, next) => {
  try {
    const abs = await Absence.findByIdAndDelete(req.params.id);
    if (!abs) return res.status(404).json({ error: 'Absence non trouvée' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
