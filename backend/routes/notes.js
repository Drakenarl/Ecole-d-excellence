const express = require('express');
const { auth, directeurOnly, staffOnly } = require('../middleware/auth');
const Note = require('../models/Note');
const Eleve = require('../models/Eleve');

const router = express.Router();

/**
 * GET /api/notes
 * Directeur : toutes les notes
 * Professeur : uniquement les notes qu'il a saisies
 * Parent : notes de ses enfants
 */
router.get('/', auth, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'professeur') query.professeur = req.user.id;
    if (req.user.role === 'parent') {
      const Parent = require('../models/Parent');
      const parent = await Parent.findById(req.user.id);
      query.eleve = { $in: parent?.eleves || [] };
    }

    const { eleve, matiere, trimestre, classe } = req.query;
    if (eleve) query.eleve = eleve;
    if (matiere) query.matiere = matiere;
    if (trimestre) query.trimestre = trimestre;
    if (classe) {
      const eleves = await Eleve.find({ classe }).select('_id');
      query.eleve = { $in: eleves.map(e => e._id) };
    }

    const notes = await Note.find(query)
      .populate('eleve', 'nom prenom classe matricule')
      .populate('professeur', 'nom prenom matiere')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (err) { next(err); }
});

/**
 * POST /api/notes
 * Directeur et professeur
 * Accepte un objet ou un tableau
 */
router.post('/', auth, staffOnly, async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    if (!payload.length) return res.status(400).json({ error: 'Aucune note fournie' });

    const toInsert = payload.map(n => {
      if (!n.eleve || !n.matiere || n.note === undefined || !n.trimestre) {
        throw Object.assign(new Error('Champs requis : eleve, matiere, note, trimestre'), { status: 400 });
      }
      // Un professeur ne peut saisir que pour sa matière
      if (req.user.role === 'professeur') {
        n.professeur = req.user.id;
      }
      return n;
    });

    const created = await Note.insertMany(toInsert);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

/**
 * PUT /api/notes/:id
 * Directeur ou le professeur qui a saisi la note
 */
router.put('/:id', auth, staffOnly, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note non trouvée' });
    if (req.user.role === 'professeur' && String(note.professeur) !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres notes' });
    }
    const { _id, eleve, professeur, ...updates } = req.body;
    Object.assign(note, updates);
    await note.save();
    res.json(note);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/notes/:id
 * Directeur uniquement
 */
router.delete('/:id', auth, directeurOnly, async (req, res, next) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note non trouvée' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

/**
 * GET /api/bulletin/:eleveId
 * Accessible à tous les rôles (parent vérifié)
 */
router.get('/bulletin/:eleveId', auth, async (req, res, next) => {
  try {
    // Vérification parent
    if (req.user.role === 'parent') {
      const Parent = require('../models/Parent');
      const parent = await Parent.findById(req.user.id);
      if (!parent?.eleves?.map(String).includes(req.params.eleveId)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    const eleve = await Eleve.findById(req.params.eleveId);
    if (!eleve) return res.status(404).json({ error: 'Élève non trouvé' });

    const { trimestre } = req.query;
    let query = { eleve: req.params.eleveId };
    if (trimestre) query.trimestre = trimestre;

    const notes = await Note.find(query).populate('professeur', 'nom prenom');

    const parMatiere = {};
    notes.forEach(n => {
      if (!parMatiere[n.matiere]) {
        parMatiere[n.matiere] = { pts: 0, coef: 0, notes: [], prof: n.professeur };
      }
      parMatiere[n.matiere].pts += n.note * n.coefficient;
      parMatiere[n.matiere].coef += n.coefficient;
      parMatiere[n.matiere].notes.push(n);
    });

    const matieres = Object.entries(parMatiere).map(([mat, d]) => ({
      matiere: mat,
      moyenne: (d.pts / d.coef).toFixed(2),
      prof: d.prof ? `${d.prof.prenom} ${d.prof.nom}` : '—',
      appreciation: d.notes[d.notes.length - 1]?.appreciation || ''
    }));

    const totalPts = matieres.reduce((s, m) => s + parseFloat(m.moyenne), 0);
    const moyGen = matieres.length ? (totalPts / matieres.length).toFixed(2) : null;
    const m = parseFloat(moyGen);
    const mention = m >= 16 ? 'Félicitations' : m >= 14 ? 'Très bien' : m >= 12 ? 'Bien' : m >= 10 ? 'Assez bien' : m >= 8 ? 'Passable' : 'Insuffisant';

    const absences = await require('../models/Absence').countDocuments({ eleve: req.params.eleveId });

    res.json({
      eleve,
      trimestre: trimestre || 'Tous',
      date_edition: new Date().toISOString().split('T')[0],
      matieres,
      moyenne_generale: moyGen,
      mention,
      absences
    });
  } catch (err) { next(err); }
});

module.exports = router;
