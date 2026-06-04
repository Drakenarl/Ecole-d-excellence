const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { auth, directeurOnly, staffOnly } = require('../middleware/auth');
const CodeAcces = require('../models/CodeAcces');
const Eleve = require('../models/Eleve');
const Professeur = require('../models/Professeur');
const Note = require('../models/Note');
const Absence = require('../models/Absence');
const Directeur = require('../models/Directeur');

const router = express.Router();

// ── CODES D'ACCÈS PARENT ──────────────────────────────────────────────────────

/**
 * POST /api/codes-acces
 * Directeur génère un code pour un ou plusieurs élèves
 * Body : { eleves: [id1, id2, ...] }
 */
router.post('/codes-acces', auth, directeurOnly, async (req, res, next) => {
  try {
    const { eleves } = req.body;
    if (!eleves || !eleves.length) return res.status(400).json({ error: 'Au moins un élève requis' });

    const code = uuidv4().split('-')[0].toUpperCase(); // ex: A3F9B2D1
    const doc = await CodeAcces.create({ code, eleves });
    await doc.populate('eleves', 'nom prenom classe matricule');
    res.status(201).json({ code: doc.code, eleves: doc.eleves, expire_le: doc.expire_le });
  } catch (err) { next(err); }
});

/**
 * GET /api/codes-acces
 * Liste tous les codes générés (directeur)
 */
router.get('/codes-acces', auth, directeurOnly, async (req, res, next) => {
  try {
    const codes = await CodeAcces.find().populate('eleves', 'nom prenom classe').sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/codes-acces/:id
 */
router.delete('/codes-acces/:id', auth, directeurOnly, async (req, res, next) => {
  try {
    await CodeAcces.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

router.get('/dashboard', auth, async (req, res, next) => {
  try {
    // Dashboard adapté selon le rôle
    if (req.user.role === 'parent') {
      const Parent = require('../models/Parent');
      const parent = await Parent.findById(req.user.id).populate('eleves');
      const eleves = parent?.eleves || [];
      const data = await Promise.all(eleves.map(async e => {
        const notes = await Note.find({ eleve: e._id });
        const absences = await Absence.find({ eleve: e._id });
        let moy = null;
        if (notes.length) {
          let pts = 0, coef = 0;
          notes.forEach(n => { pts += n.note * n.coefficient; coef += n.coefficient; });
          moy = (pts / coef).toFixed(2);
        }
        return { ...e.toObject(), moyenne: moy, absences: absences.length };
      }));
      return res.json({ role: 'parent', eleves: data });
    }

    if (req.user.role === 'professeur') {
      const notes = await Note.find({ professeur: req.user.id });
      const absences = await Absence.find({ professeur: req.user.id });
      const edt = await require('../models/EmploiDuTemps').find({ professeur: req.user.id });
      const matieres = [...new Set(notes.map(n => n.matiere))];
      const classes = [...new Set(edt.map(e => e.classe))];
      return res.json({
        role: 'professeur',
        stats: {
          notes_saisies: notes.length,
          absences_enregistrees: absences.length,
          classes: classes,
          matieres: matieres,
          creneaux_semaine: edt.length
        }
      });
    }

    // Directeur : vue globale
    const [totalEleves, totalProfs, notes, absences] = await Promise.all([
      Eleve.countDocuments(),
      Professeur.countDocuments(),
      Note.find(),
      Absence.find()
    ]);

    const elevesActifs = await Eleve.countDocuments({ statut: 'actif' });
    const profsActifs = await Professeur.countDocuments({ statut: 'actif' });
    const classes = await Eleve.distinct('classe');
    const nonJustif = absences.filter(a => !a.justifiee).length;

    const moy = notes.length
      ? (notes.reduce((s, n) => s + n.note, 0) / notes.length).toFixed(2)
      : 0;

    // Top 5 élèves
    const moyByEleve = {};
    notes.forEach(n => {
      const id = String(n.eleve);
      if (!moyByEleve[id]) moyByEleve[id] = { pts: 0, coef: 0 };
      moyByEleve[id].pts += n.note * n.coefficient;
      moyByEleve[id].coef += n.coefficient;
    });
    const topIds = Object.entries(moyByEleve)
      .map(([id, d]) => ({ id, moy: d.pts / d.coef }))
      .sort((a, b) => b.moy - a.moy)
      .slice(0, 5)
      .map(e => e.id);

    const topEleves = await Promise.all(topIds.map(async id => {
      const e = await Eleve.findById(id).select('nom prenom classe');
      const d = moyByEleve[id];
      return e ? { ...e.toObject(), moyenne: (d.pts / d.coef).toFixed(2) } : null;
    }));

    // Répartition par classe
    const repartition = {};
    (await Eleve.find().select('classe')).forEach(e => {
      repartition[e.classe] = (repartition[e.classe] || 0) + 1;
    });

    res.json({
      role: 'directeur',
      stats: {
        total_eleves: totalEleves, eleves_actifs: elevesActifs,
        total_profs: totalProfs, profs_actifs: profsActifs,
        total_classes: classes.length, moyenne_generale: parseFloat(moy),
        absences_non_justifiees: nonJustif, total_notes: notes.length
      },
      top_eleves: topEleves.filter(Boolean),
      repartition_classes: repartition,
      alertes: [
        { type: 'warning', message: `${nonJustif} absences non justifiées` },
        { type: 'success', message: `${elevesActifs} élèves actifs inscrits` },
        { type: 'info', message: `${classes.length} classes actives` }
      ]
    });
  } catch (err) { next(err); }
});

// ── STATISTIQUES ─────────────────────────────────────────────────────────────

router.get('/stats/classes', auth, staffOnly, async (req, res, next) => {
  try {
    const classes = await Eleve.distinct('classe');
    const result = await Promise.all(classes.sort().map(async classe => {
      const eleves = await Eleve.find({ classe }).select('_id');
      const ids = eleves.map(e => e._id);
      const notes = await Note.find({ eleve: { $in: ids } });
      const moy = notes.length ? (notes.reduce((s, n) => s + n.note, 0) / notes.length).toFixed(2) : null;
      return { classe, nb_eleves: eleves.length, moyenne: moy, nb_notes: notes.length };
    }));
    res.json(result);
  } catch (err) { next(err); }
});

// ── PARAMÈTRES ÉCOLE ─────────────────────────────────────────────────────────

router.get('/parametres', auth, directeurOnly, async (req, res, next) => {
  try {
    const dir = await Directeur.findById(req.user.id);
    res.json(dir?.ecole || {});
  } catch (err) { next(err); }
});

router.put('/parametres', auth, directeurOnly, async (req, res, next) => {
  try {
    const dir = await Directeur.findByIdAndUpdate(
      req.user.id,
      { $set: { ecole: req.body } },
      { new: true }
    );
    res.json(dir?.ecole || {});
  } catch (err) { next(err); }
});

module.exports = router;
