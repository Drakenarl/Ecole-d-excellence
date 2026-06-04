#!/usr/bin/env python3
"""
École Excellence — Script d'automatisation Python
Fonctions : rapports, statistiques, sauvegardes, alertes, génération de bulletins PDF-texte

Usage :
  python3 scripts/automatisation.py --action rapport
  python3 scripts/automatisation.py --action stats
  python3 scripts/automatisation.py --action sauvegarde
  python3 scripts/automatisation.py --action alertes
  python3 scripts/automatisation.py --action bulletin --eleve eleve_1
  python3 scripts/automatisation.py --action all
"""

import json, os, argparse, shutil, datetime, statistics
from pathlib import Path

BASE = Path(__file__).parent.parent
DATA = BASE / "data"
REPORTS = BASE / "reports"
BACKUPS = BASE / "backups"
REPORTS.mkdir(exist_ok=True)
BACKUPS.mkdir(exist_ok=True)

def load(name):
    f = DATA / f"{name}.json"
    if not f.exists(): return []
    d = json.loads(f.read_text(encoding='utf-8'))
    return d if isinstance(d, list) else [d]

def save(name, data):
    (DATA / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

def now(): return datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
def today(): return datetime.date.today().isoformat()

def sep(char='─', n=60): return char * n

# ── Statistiques globales ─────────────────────────────────────
def action_stats():
    eleves = load('eleves')
    profs = load('professeurs')
    notes = load('notes')
    absences = load('absences')

    print(sep('═'))
    print(f"  STATISTIQUES ÉCOLE — {now()}")
    print(sep('═'))

    # Élèves
    actifs = [e for e in eleves if e.get('statut') == 'actif']
    classes = {}
    for e in eleves:
        c = e.get('classe','?')
        classes[c] = classes.get(c, 0) + 1

    print(f"\n{'ÉLÈVES':}")
    print(sep())
    print(f"  Total inscrits    : {len(eleves)}")
    print(f"  Élèves actifs     : {len(actifs)}")
    print(f"  Élèves inactifs   : {len(eleves) - len(actifs)}")
    print(f"  Nombre de classes : {len(classes)}")
    print(f"\n  Répartition par classe :")
    for c, n in sorted(classes.items()):
        print(f"    {c:<12} : {n:>3} élèves")

    # Professeurs
    profs_actifs = [p for p in profs if p.get('statut') == 'actif']
    print(f"\nPROFESSEURS")
    print(sep())
    print(f"  Total            : {len(profs)}")
    print(f"  Actifs           : {len(profs_actifs)}")
    total_h = sum(p.get('heures_semaine', 0) for p in profs_actifs)
    print(f"  Heures/sem total : {total_h}h")

    # Notes
    vals = [n['note'] for n in notes if isinstance(n.get('note'), (int, float))]
    print(f"\nNOTES & RÉSULTATS")
    print(sep())
    if vals:
        moy = statistics.mean(vals)
        med = statistics.median(vals)
        print(f"  Total notes      : {len(vals)}")
        print(f"  Moyenne générale : {moy:.2f}/20")
        print(f"  Médiane          : {med:.2f}/20")
        print(f"  Note max         : {max(vals):.1f}")
        print(f"  Note min         : {min(vals):.1f}")
        reussite = sum(1 for v in vals if v >= 10) / len(vals) * 100
        print(f"  Taux de réussite : {reussite:.1f}%")

        # Moyennes par matière
        par_mat = {}
        for n in notes:
            m = n.get('matiere', '?')
            if m not in par_mat: par_mat[m] = []
            if isinstance(n.get('note'), (int, float)):
                par_mat[m].append(n['note'])
        print(f"\n  Moyennes par matière :")
        for mat, ns in sorted(par_mat.items(), key=lambda x: -statistics.mean(x[1]) if x[1] else 0):
            if ns:
                print(f"    {mat:<25} : {statistics.mean(ns):.2f}/20  ({len(ns)} notes)")

    # Absences
    non_justif = [a for a in absences if not a.get('justifiee')]
    print(f"\nABSENCES")
    print(sep())
    print(f"  Total absences         : {len(absences)}")
    print(f"  Non justifiées         : {len(non_justif)}")
    print(f"  Justifiées             : {len(absences) - len(non_justif)}")
    print(f"\n{sep('═')}\n")

# ── Rapport mensuel ───────────────────────────────────────────
def action_rapport():
    eleves = load('eleves')
    profs = load('professeurs')
    notes = load('notes')
    absences = load('absences')
    admin_list = load('admin')
    admin = admin_list[0] if admin_list else {}
    ecole = admin.get('ecole', {})

    date_str = today()
    rapport = []
    rapport.append("=" * 70)
    rapport.append(f"  RAPPORT MENSUEL — {ecole.get('nom', 'École')}")
    rapport.append(f"  Généré le {date_str} | Année {ecole.get('annee_scolaire','2025-2026')}")
    rapport.append("=" * 70)

    # Résumé effectifs
    rapport.append("\n1. EFFECTIFS")
    rapport.append("-" * 40)
    rapport.append(f"   Élèves inscrits   : {len(eleves)}")
    rapport.append(f"   Élèves actifs     : {len([e for e in eleves if e.get('statut')=='actif'])}")
    rapport.append(f"   Corps enseignant  : {len(profs)} professeurs")
    classes = {}
    for e in eleves:
        c = e.get('classe','?')
        classes[c] = classes.get(c, 0) + 1
    rapport.append(f"   Classes actives   : {len(classes)}")

    # Résultats académiques
    vals = [n['note'] for n in notes if isinstance(n.get('note'), (int, float))]
    rapport.append("\n2. RÉSULTATS ACADÉMIQUES")
    rapport.append("-" * 40)
    if vals:
        moy = statistics.mean(vals)
        rapport.append(f"   Moyenne générale  : {moy:.2f}/20")
        rapport.append(f"   Taux de réussite  : {sum(1 for v in vals if v>=10)/len(vals)*100:.1f}%")
        rapport.append(f"   Élèves en danger  : {sum(1 for v in vals if v<8)} (< 8/20)")

    # Top 5 élèves
    moy_eleve = {}
    for n in notes:
        eid = n.get('eleve_id')
        if not eid: continue
        if eid not in moy_eleve: moy_eleve[eid] = []
        if isinstance(n.get('note'), (int, float)):
            moy_eleve[eid].append(n['note'])
    top = sorted([(eid, statistics.mean(ns)) for eid, ns in moy_eleve.items() if ns],
                 key=lambda x: -x[1])[:5]
    rapport.append("\n3. TOP 5 ÉLÈVES DU MOIS")
    rapport.append("-" * 40)
    for i, (eid, moy) in enumerate(top, 1):
        eleve = next((e for e in eleves if e['_id'] == eid), None)
        if eleve:
            rapport.append(f"   {i}. {eleve.get('prenom','')} {eleve.get('nom','')} ({eleve.get('classe','')}) — {moy:.2f}/20")

    # Absences
    rapport.append("\n4. ASSIDUITÉ")
    rapport.append("-" * 40)
    rapport.append(f"   Total absences       : {len(absences)}")
    rapport.append(f"   Non justifiées       : {len([a for a in absences if not a.get('justifiee')])}")

    rapport.append("\n" + "=" * 70 + "\n")

    text = "\n".join(rapport)
    fname = REPORTS / f"rapport_{date_str}.txt"
    fname.write_text(text, encoding='utf-8')
    print(text)
    print(f"✅ Rapport sauvegardé : {fname}")

# ── Sauvegarde ────────────────────────────────────────────────
def action_sauvegarde():
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = BACKUPS / ts
    dest.mkdir()
    count = 0
    for f in DATA.glob("*.json"):
        if "backup" not in f.name:
            shutil.copy2(f, dest / f.name)
            count += 1
    print(f"✅ Sauvegarde créée : {dest} ({count} fichiers)")

    # Nettoyer les sauvegardes > 30 jours
    now_ts = datetime.datetime.now()
    for d in BACKUPS.iterdir():
        if d.is_dir():
            try:
                age = now_ts - datetime.datetime.strptime(d.name[:15], "%Y%m%d_%H%M%S")
                if age.days > 30:
                    shutil.rmtree(d)
                    print(f"  🗑  Ancienne sauvegarde supprimée : {d.name}")
            except: pass

# ── Alertes ───────────────────────────────────────────────────
def action_alertes():
    eleves = load('eleves')
    notes = load('notes')
    absences = load('absences')

    alertes = []
    print(sep('═'))
    print(f"  ALERTES & NOTIFICATIONS — {now()}")
    print(sep('═'))

    # Élèves en difficulté (moyenne < 8)
    moy_eleve = {}
    for n in notes:
        eid = n.get('eleve_id')
        if not eid: continue
        if eid not in moy_eleve: moy_eleve[eid] = []
        if isinstance(n.get('note'), (int, float)):
            moy_eleve[eid].append(n['note'])

    en_danger = [(eid, statistics.mean(ns)) for eid, ns in moy_eleve.items() if ns and statistics.mean(ns) < 8]
    if en_danger:
        print(f"\n⚠️  ÉLÈVES EN DIFFICULTÉ (moy < 8/20) : {len(en_danger)}")
        for eid, moy in sorted(en_danger, key=lambda x: x[1]):
            e = next((el for el in eleves if el['_id'] == eid), None)
            if e:
                print(f"   • {e.get('prenom','')} {e.get('nom','')} ({e.get('classe','')}) — {moy:.2f}/20")
                alertes.append(f"DANGER: {e.get('prenom','')} {e.get('nom','')} moy={moy:.2f}")

    # Absences répétées (> 3 absences non justifiées)
    abs_count = {}
    for a in absences:
        if not a.get('justifiee'):
            eid = a.get('eleve_id')
            abs_count[eid] = abs_count.get(eid, 0) + 1
    absenteistes = [(eid, c) for eid, c in abs_count.items() if c > 3]
    if absenteistes:
        print(f"\n🚨  ABSENTÉISME RÉPÉTÉ (> 3 absences non justifiées) : {len(absenteistes)}")
        for eid, c in sorted(absenteistes, key=lambda x: -x[1]):
            e = next((el for el in eleves if el['_id'] == eid), None)
            if e:
                print(f"   • {e.get('prenom','')} {e.get('nom','')} ({e.get('classe','')}) — {c} absences")

    if not en_danger and not absenteistes:
        print("\n✅ Aucune alerte critique détectée.")
    print(f"\n{sep('═')}\n")

    # Log des alertes
    log_file = DATA / "alertes_log.json"
    logs = json.loads(log_file.read_text()) if log_file.exists() else []
    logs.append({"date": today(), "alertes": alertes})
    log_file.write_text(json.dumps(logs[-50:], indent=2, ensure_ascii=False))

# ── Bulletin texte ────────────────────────────────────────────
def action_bulletin(eleve_id):
    eleves = load('eleves')
    notes = load('notes')
    profs = load('professeurs')

    eleve = next((e for e in eleves if e['_id'] == eleve_id), None)
    if not eleve:
        print(f"❌ Élève '{eleve_id}' non trouvé.")
        return

    eleve_notes = [n for n in notes if n.get('eleve_id') == eleve_id]
    par_mat = {}
    for n in eleve_notes:
        m = n.get('matiere', '?')
        if m not in par_mat: par_mat[m] = {'notes': [], 'coef': []}
        if isinstance(n.get('note'), (int, float)):
            par_mat[m]['notes'].append(n['note'])
            par_mat[m]['coef'].append(n.get('coefficient', 1))

    lines = []
    lines.append("=" * 60)
    lines.append(f"  BULLETIN SCOLAIRE — {datetime.date.today().year}")
    lines.append("=" * 60)
    lines.append(f"  Élève   : {eleve.get('prenom','')} {eleve.get('nom','')}")
    lines.append(f"  Classe  : {eleve.get('classe','')}")
    lines.append(f"  Édité le: {today()}")
    lines.append("-" * 60)
    lines.append(f"  {'Matière':<28} {'Moy':>5}  Appréciation")
    lines.append("-" * 60)

    total_pts = 0; total_coef = 0
    for mat, d in sorted(par_mat.items()):
        if d['notes']:
            pts = sum(n * c for n, c in zip(d['notes'], d['coef']))
            coef = sum(d['coef'])
            moy = pts / coef
            total_pts += moy; total_coef += 1
            mention = "Excellent" if moy>=16 else "Très bien" if moy>=14 else "Bien" if moy>=12 else "Assez bien" if moy>=10 else "À améliorer"
            lines.append(f"  {mat:<28} {moy:>5.2f}  {mention}")

    moy_gen = total_pts / total_coef if total_coef else 0
    lines.append("=" * 60)
    mention_gen = "Félicitations" if moy_gen>=16 else "Très bien" if moy_gen>=14 else "Bien" if moy_gen>=12 else "Assez bien" if moy_gen>=10 else "Insuffisant"
    lines.append(f"  MOYENNE GÉNÉRALE : {moy_gen:.2f}/20  →  {mention_gen}")
    lines.append("=" * 60)

    text = "\n".join(lines)
    print(text)
    fname = REPORTS / f"bulletin_{eleve.get('nom','').lower()}_{today()}.txt"
    fname.write_text(text, encoding='utf-8')
    print(f"\n✅ Bulletin sauvegardé : {fname}")

# ── Main ──────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Automatisation École Excellence")
    parser.add_argument('--action', choices=['stats','rapport','sauvegarde','alertes','bulletin','all'], default='all')
    parser.add_argument('--eleve', help='ID élève pour le bulletin', default=None)
    args = parser.parse_args()

    if args.action in ('stats', 'all'):      action_stats()
    if args.action in ('rapport', 'all'):    action_rapport()
    if args.action in ('sauvegarde', 'all'): action_sauvegarde()
    if args.action in ('alertes', 'all'):    action_alertes()
    if args.action == 'bulletin':
        if not args.eleve:
            eleves = load('eleves')
            if eleves: action_bulletin(eleves[0]['_id'])
        else:
            action_bulletin(args.eleve)
