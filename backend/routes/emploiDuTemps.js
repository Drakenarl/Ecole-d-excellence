const express = require('express');
const { auth, directeurOnly, staffOnly } = require('../middleware/auth');
const EmploiDuTemps = require('../models/EmploiDuTemps');

const router = express.Router();

const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

/** GET /api/emploi-du-temps */
router.get('/', auth, async (req, res, next) => {
  try {
    let query = {};
    const { classe, professeur, jour } = req.query;
    if (classe) query.classe = classe;
    if (professeur) query.professeur = professeur;
    if (jour) query.jour = jour;
    // Un professeur ne voit que son emploi du temps
    if (req.user.role === 'professeur') query.professeur = req.user.id;

    const edt = await EmploiDuTemps.find(query)
      .populate('professeur', 'nom prenom matiere')
      .sort({ jour: 1, creneau: 1 });

    res.json(edt);
  } catch (err) { next(err); }
});

/** POST /api/emploi-du-temps — Directeur uniquement */
router.post('/', auth, directeurOnly, async (req, res, next) => {
  try {
    const { classe, professeur, matiere, jour, creneau } = req.body;
    if (!classe || !professeur || !matiere || !jour || !creneau) {
      return res.status(400).json({ error: 'Champs requis : classe, professeur, matiere, jour, creneau' });
    }
    if (!JOURS.includes(jour)) {
      return res.status(400).json({ error: `Jour invalide. Valeurs : ${JOURS.join(', ')}` });
    }
    const slot = await EmploiDuTemps.create(req.body);
    res.status(201).json(slot);
  } catch (err) { next(err); }
});

/** PUT /api/emploi-du-temps/:id — Directeur uniquement */
router.put('/:id', auth, directeurOnly, async (req, res, next) => {
  try {
    const { _id, ...updates } = req.body;
    const slot = await EmploiDuTemps.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!slot) return res.status(404).json({ error: 'Créneau non trouvé' });
    res.json(slot);
  } catch (err) { next(err); }
});

/** DELETE /api/emploi-du-temps/:id — Directeur uniquement */
router.delete('/:id', auth, directeurOnly, async (req, res, next) => {
  try {
    const slot = await EmploiDuTemps.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Créneau non trouvé' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
