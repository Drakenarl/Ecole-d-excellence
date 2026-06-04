const express = require('express');
const { auth, directeurOnly, staffOnly } = require('../middleware/auth');
const Eleve = require('../models/Eleve');
const Note = require('../models/Note');
const Absence = require('../models/Absence');

const router = express.Router();

// Helper : calcule la moyenne générale d'un élève
async function calcMoyenne(eleveId) {
  const notes = await Note.find({ eleve: eleveId });
  if (!notes.length) return null;
  let pts = 0, coef = 0;
  notes.forEach(n => { pts += n.note * n.coefficient; coef += n.coefficient; });
  return coef > 0 ? (pts / coef).toFixed(2) : null;
}

/**
 * GET /api/eleves
 * Directeur & professeur : tous les élèves
 * Parent : uniquement ses enfants (via token)
 */
router.get('/', auth, async (req, res, next) => {
  try {
    let query = {};

    // Un parent ne voit que ses enfants
    if (req.user.role === 'parent') {
      const Parent = require('../models/Parent');
      const parent = await Parent.findById(req.user.id);
      query = { _id: { $in: parent?.eleves || [] } };
    }

    const { classe, statut, search, page = 1, limit = 20 } = req.query;
    if (classe) query.classe = classe;
    if (statut) query.statut = statut;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ nom: re }, { prenom: re }, { matricule: re }];
    }

    const total = await Eleve.countDocuments(query);
    const eleves = await Eleve.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ nom: 1 });

    // Enrichir avec la moyenne
    const data = await Promise.all(eleves.map(async e => ({
      ...e.toObject(),
      moyenne: await calcMoyenne(e._id)
    })));

    res.json({ total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)), data });
  } catch (err) { next(err); }
});

/**
 * GET /api/eleves/:id
 * Détail complet + notes + absences + bulletin
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    // Un parent ne peut accéder qu'à ses propres enfants
    if (req.user.role === 'parent') {
      const Parent = require('../models/Parent');
      const parent = await Parent.findById(req.user.id);
      const autorise = parent?.eleves?.map(String).includes(req.params.id);
      if (!autorise) return res.status(403).json({ error: 'Accès non autorisé à cet élève' });
    }

    const eleve = await Eleve.findById(req.params.id);
    if (!eleve) return res.status(404).json({ error: 'Élève non trouvé' });

    const notes = await Note.find({ eleve: req.params.id }).populate('professeur', 'nom prenom');
    const absences = await Absence.find({ eleve: req.params.id });

    // Bulletin : moyennes par matière
    const parMatiere = {};
    notes.forEach(n => {
      if (!parMatiere[n.matiere]) parMatiere[n.matiere] = { pts: 0, coef: 0, prof: n.professeur };
      parMatiere[n.matiere].pts += n.note * n.coefficient;
      parMatiere[n.matiere].coef += n.coefficient;
    });

    const bulletin = Object.entries(parMatiere).map(([mat, d]) => ({
      matiere: mat,
      moyenne: (d.pts / d.coef).toFixed(2),
      prof: d.prof ? `${d.prof.prenom} ${d.prof.nom}` : '—'
    }));

    const totalPts = bulletin.reduce((s, b) => s + parseFloat(b.moyenne), 0);
    const moyGen = bulletin.length ? (totalPts / bulletin.length).toFixed(2) : null;

    res.json({ ...eleve.toObject(), notes, absences, bulletin, moyenne_generale: moyGen });
  } catch (err) { next(err); }
});

/**
 * POST /api/eleves
 * Directeur uniquement
 */
router.post('/', auth, directeurOnly, async (req, res, next) => {
  try {
    const { nom, prenom, classe, sexe } = req.body;
    if (!nom || !prenom || !classe || !sexe) {
      return res.status(400).json({ error: 'Champs requis : nom, prenom, classe, sexe' });
    }
    const eleve = await Eleve.create(req.body);
    res.status(201).json(eleve);
  } catch (err) { next(err); }
});

/**
 * PUT /api/eleves/:id
 * Directeur uniquement
 */
router.put('/:id', auth, directeurOnly, async (req, res, next) => {
  try {
    const { matricule, _id, ...updates } = req.body;
    const eleve = await Eleve.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!eleve) return res.status(404).json({ error: 'Élève non trouvé' });
    res.json(eleve);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/eleves/:id
 * Directeur uniquement
 */
router.delete('/:id', auth, directeurOnly, async (req, res, next) => {
  try {
    const eleve = await Eleve.findByIdAndDelete(req.params.id);
    if (!eleve) return res.status(404).json({ error: 'Élève non trouvé' });
    // Supprimer notes et absences liées
    await Note.deleteMany({ eleve: req.params.id });
    await Absence.deleteMany({ eleve: req.params.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
