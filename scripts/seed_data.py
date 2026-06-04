#!/usr/bin/env python3
"""
Script de génération de données initiales pour l'école.
Lance avec: python3 scripts/seed_data.py
"""
import json, random, os, hashlib, datetime
from faker import Faker

fake = Faker('fr_FR')
random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

MATIERES = ['Mathématiques','Français','Sciences','Histoire-Géographie',
            'Anglais','Éducation physique','Arts plastiques','Informatique']
CLASSES = ['6ème A','6ème B','5ème A','5ème B','4ème A','4ème B','3ème A','3ème B']
SALLES = [f'Salle {i}' for i in range(1,16)] + ['Laboratoire','Gymnase','Salle informatique']

def gen_note():
    base = random.gauss(12, 3.5)
    return round(max(0, min(20, base)), 2)

def gen_date(start_year=2005, end_year=2015):
    start = datetime.date(start_year, 1, 1)
    end = datetime.date(end_year, 12, 31)
    return start + datetime.timedelta(days=random.randint(0,(end-start).days))

# ── Professeurs ──────────────────────────────────────────────────────────────
profs = []
for i, matiere in enumerate(MATIERES):
    profs.append({
        "_id": f"prof_{i+1}",
        "nom": fake.last_name(),
        "prenom": fake.first_name(),
        "email": fake.email(),
        "telephone": fake.phone_number(),
        "matiere": matiere,
        "classes": random.sample(CLASSES, random.randint(2,4)),
        "heures_semaine": random.randint(14, 22),
        "date_embauche": str(gen_date(2010, 2024)),
        "statut": random.choice(["actif","actif","actif","conge"]),
        "salaire": random.randint(180000, 350000),
        "password_hash": hashlib.sha256(b"prof1234").hexdigest(),
        "role": "professeur"
    })

with open(os.path.join(DATA_DIR,'professeurs.json'),'w', encoding='utf-8') as f:
    json.dump(profs, f, ensure_ascii=False, indent=2)
print(f"✅ {len(profs)} professeurs créés")

# ── Élèves ───────────────────────────────────────────────────────────────────
eleves = []
for i in range(120):
    classe = random.choice(CLASSES)
    dob = gen_date(2009, 2014)
    eleves.append({
        "_id": f"eleve_{i+1}",
        "matricule": f"ELV{2025}{i+1:04d}",
        "nom": fake.last_name(),
        "prenom": fake.first_name(),
        "sexe": random.choice(["M","F"]),
        "date_naissance": str(dob),
        "lieu_naissance": fake.city(),
        "classe": classe,
        "telephone_parent": fake.phone_number(),
        "email_parent": fake.email(),
        "nom_parent": fake.name(),
        "adresse": fake.address().replace('\n',', '),
        "date_inscription": str(gen_date(2025, 2025)),
        "statut": random.choice(["actif","actif","actif","inactif"]),
        "photo": None
    })

with open(os.path.join(DATA_DIR,'eleves.json'),'w', encoding='utf-8') as f:
    json.dump(eleves, f, ensure_ascii=False, indent=2)
print(f"✅ {len(eleves)} élèves créés")

# ── Notes ─────────────────────────────────────────────────────────────────────
notes = []
trims = ["T1","T2","T3"]
types_eval = ["Devoir surveillé","Contrôle continu","Examen"]
nid = 1
for eleve in eleves:
    for matiere in random.sample(MATIERES, random.randint(5,8)):
        for trim in trims:
            prof = next((p for p in profs if p["matiere"]==matiere), profs[0])
            notes.append({
                "_id": f"note_{nid}",
                "eleve_id": eleve["_id"],
                "prof_id": prof["_id"],
                "matiere": matiere,
                "trimestre": trim,
                "note": gen_note(),
                "coefficient": random.choice([1,2,3]),
                "type": random.choice(types_eval),
                "appreciation": random.choice([
                    "Excellent travail","Très bon","Bon travail","Peut mieux faire",
                    "Des lacunes à combler","Insuffisant","En progrès","Bien"
                ]),
                "date": str(gen_date(2025,2025))
            })
            nid += 1

with open(os.path.join(DATA_DIR,'notes.json'),'w', encoding='utf-8') as f:
    json.dump(notes, f, ensure_ascii=False, indent=2)
print(f"✅ {len(notes)} notes créées")

# ── Emploi du temps ──────────────────────────────────────────────────────────
jours = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi"]
creneaux = ["07:30-09:30","09:30-11:30","11:30-13:30","13:30-15:30","15:30-17:30"]
edt = []
eid = 1
for classe in CLASSES:
    for jour in jours:
        slots = random.sample(creneaux, random.randint(3,5))
        for creneau in slots:
            matiere = random.choice(MATIERES)
            prof = next((p for p in profs if p["matiere"]==matiere), profs[0])
            edt.append({
                "_id": f"edt_{eid}",
                "classe": classe,
                "jour": jour,
                "creneau": creneau,
                "matiere": matiere,
                "prof_id": prof["_id"],
                "salle": random.choice(SALLES)
            })
            eid += 1

with open(os.path.join(DATA_DIR,'emploi_du_temps.json'),'w', encoding='utf-8') as f:
    json.dump(edt, f, ensure_ascii=False, indent=2)
print(f"✅ {len(edt)} créneaux d'emploi du temps créés")

# ── Absences ─────────────────────────────────────────────────────────────────
absences = []
for i, eleve in enumerate(random.sample(eleves, 40)):
    absences.append({
        "_id": f"abs_{i+1}",
        "eleve_id": eleve["_id"],
        "date": str(gen_date(2025,2025)),
        "motif": random.choice(["Maladie","Sans motif","Raison familiale","Rendez-vous médical","Autre"]),
        "justifiee": random.choice([True, False]),
        "cours": random.choice(MATIERES)
    })

with open(os.path.join(DATA_DIR,'absences.json'),'w', encoding='utf-8') as f:
    json.dump(absences, f, ensure_ascii=False, indent=2)
print(f"✅ {len(absences)} absences créées")

# ── Admin ─────────────────────────────────────────────────────────────────────
admin = {
    "_id": "admin_1",
    "nom": "Diallo",
    "prenom": "Administrateur",
    "email": "admin@ecole.bj",
    "password_hash": hashlib.sha256(b"admin1234").hexdigest(),
    "role": "admin",
    "ecole": {
        "nom": "École Excellence Cotonou",
        "adresse": "Quartier Cadjèhoun, Cotonou, Bénin",
        "telephone": "+229 21 30 XX XX",
        "email": "contact@ecole-excellence.bj",
        "annee_scolaire": "2025-2026",
        "systeme_notation": 20,
        "devise": "XOF"
    }
}
with open(os.path.join(DATA_DIR,'admin.json'),'w', encoding='utf-8') as f:
    json.dump(admin, f, ensure_ascii=False, indent=2)

print("\n🎉 Données générées avec succès dans /data/")
print("   Connexion admin : admin@ecole.bj / admin1234")
print("   Connexion prof  : (email prof) / prof1234")
