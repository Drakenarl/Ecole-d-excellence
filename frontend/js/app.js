/**
 * École Excellence v3.0.0 — Application SPA
 * 3 rôles : directeur | professeur | parent
 * API_URL défini dans js/config.js
 */

let STATE = {
  token: localStorage.getItem('token'),
  user:  JSON.parse(localStorage.getItem('user') || 'null'),
  page:  'dashboard',
  classes: []
};

// ── Utilitaires ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
const qq = sel => document.querySelectorAll(sel);

function toast(msg, type = 'info', dur = 3500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('toast-container').appendChild(el);
  setTimeout(() => el.remove(), dur);
}

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (STATE.token) headers['Authorization'] = `Bearer ${STATE.token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + path, opts);
  if (r.status === 401) { logout(); return null; }
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erreur serveur'); }
  return r.json();
}

function initials(nom = '', prenom = '') {
  return ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '??';
}

function avColor(str) {
  const c = ['av-blue','av-teal','av-coral','av-purple','av-amber','av-green','av-pink'];
  let h = 0; for (const ch of str) h += ch.charCodeAt(0);
  return c[h % c.length];
}

function noteClass(n) {
  n = parseFloat(n);
  if (n >= 14) return 'text-success';
  if (n >= 10) return 'text-warning';
  return 'text-danger';
}

function mention(m) {
  m = parseFloat(m);
  if (m >= 16) return '<span class="badge badge-gold">Félicitations</span>';
  if (m >= 14) return '<span class="badge badge-info">Très bien</span>';
  if (m >= 12) return '<span class="badge badge-success">Bien</span>';
  if (m >= 10) return '<span class="badge badge-navy">Assez bien</span>';
  if (m >= 8)  return '<span class="badge badge-warning">Passable</span>';
  return '<span class="badge badge-danger">Insuffisant</span>';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function loader() {
  return '<div class="loader"><div class="spinner"></div> Chargement...</div>';
}

function icon(name) {
  const icons = {
    home:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    users:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    teacher:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    notes:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    alert:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    chart:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    key:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    plus:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    eye:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    edit:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    child:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>',
  };
  return `<span style="display:inline-flex;align-items:center;width:16px;height:16px">${icons[name] || ''}</span>`;
}

// ── Menus sidebar selon rôle ──────────────────────────────────
const MENUS = {
  directeur: [
    { id: 'dashboard', label: 'Tableau de bord', ico: 'home' },
    { id: 'eleves',    label: 'Élèves',           ico: 'users' },
    { id: 'profs',     label: 'Professeurs',       ico: 'teacher' },
    { id: 'notes',     label: 'Notes & Bulletins', ico: 'notes' },
    { id: 'absences',  label: 'Absences',          ico: 'alert' },
    { id: 'agenda',    label: 'Emploi du temps',   ico: 'calendar' },
    { id: 'codes',     label: 'Codes parents',     ico: 'key' },
    { id: 'stats',     label: 'Statistiques',      ico: 'chart' },
    { id: 'params',    label: 'Paramètres',        ico: 'settings' },
  ],
  professeur: [
    { id: 'dashboard', label: 'Mon espace',        ico: 'home' },
    { id: 'notes',     label: 'Mes notes',         ico: 'notes' },
    { id: 'absences',  label: 'Absences',          ico: 'alert' },
    { id: 'agenda',    label: 'Mon emploi du temps', ico: 'calendar' },
  ],
  parent: [
    { id: 'dashboard', label: 'Mes enfants',       ico: 'child' },
    { id: 'notes',     label: 'Notes',             ico: 'notes' },
    { id: 'absences',  label: 'Absences',          ico: 'alert' },
  ]
};

// ── Auth ──────────────────────────────────────────────────────
function showLogin()    { $('login-screen').style.display = 'flex'; $('register-screen').classList.remove('show'); }
function showRegister() { $('login-screen').style.display = 'none'; $('register-screen').classList.add('show'); }

async function login() {
  const email = $('login-email').value.trim();
  const pass  = $('login-password').value;
  const errEl = $('login-error');
  if (!email || !pass) { errEl.textContent = 'Veuillez remplir tous les champs.'; errEl.classList.add('show'); return; }
  $('btn-login').disabled = true; $('btn-login').textContent = 'Connexion...';
  try {
    const data = await api('POST', '/login', { email, password: pass });
    if (!data) return;
    setSession(data);
    navigate('dashboard');
  } catch (e) {
    errEl.textContent = e.message || 'Identifiants incorrects';
    errEl.classList.add('show');
  } finally {
    $('btn-login').disabled = false; $('btn-login').textContent = 'Se connecter';
  }
}

async function register() {
  const errEl = $('register-error');
  const body = {
    nom:      $('r-nom').value.trim(),
    prenom:   $('r-prenom').value.trim(),
    email:    $('r-email').value.trim(),
    password: $('r-password').value,
    telephone:$('r-tel').value.trim(),
    code:     $('r-code').value.trim().toUpperCase()
  };
  if (!body.nom || !body.prenom || !body.email || !body.password || !body.code) {
    errEl.textContent = 'Tous les champs sont requis.'; errEl.classList.add('show'); return;
  }
  $('btn-register').disabled = true; $('btn-register').textContent = 'Création...';
  try {
    const data = await api('POST', '/register-parent', body);
    if (!data) return;
    setSession(data);
    navigate('dashboard');
  } catch (e) {
    errEl.textContent = e.message || 'Erreur lors de la création';
    errEl.classList.add('show');
  } finally {
    $('btn-register').disabled = false; $('btn-register').textContent = 'Créer mon compte';
  }
}

function setSession(data) {
  STATE.token = data.token;
  STATE.user  = data.user;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  $('login-screen').style.display = 'none';
  $('register-screen').classList.remove('show');
  $('app').classList.add('visible');
  document.body.className = `role-${data.user.role}`;
  renderSidebar();
  renderUserChip();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  STATE = { token: null, user: null, page: 'dashboard', classes: [] };
  $('app').classList.remove('visible');
  $('login-screen').style.display = 'flex';
  document.body.className = '';
  $('login-email').value = '';
  $('login-password').value = '';
}

function renderSidebar() {
  const role = STATE.user?.role;
  const menu = MENUS[role] || [];
  $('sidebar-nav').innerHTML = menu.map(m => `
    <div class="nav-item" data-page="${m.id}" onclick="navigate('${m.id}')">
      ${icon(m.ico)}<span>${m.label}</span>
    </div>
  `).join('');
}

function renderUserChip() {
  const u = STATE.user;
  if (!u) return;
  $('user-initials').textContent  = initials(u.nom, u.prenom);
  $('user-fullname').textContent  = `${u.prenom} ${u.nom}`;
  const labels = { directeur: 'Directeur', professeur: 'Professeur', parent: 'Parent' };
  $('user-role-label').textContent = labels[u.role] || u.role;
}

// ── Navigation ────────────────────────────────────────────────
const PAGE_META = {
  dashboard: ['Tableau de bord', ''],
  eleves:    ['Élèves', 'Gestion des inscriptions'],
  profs:     ['Professeurs', 'Corps enseignant'],
  notes:     ['Notes & Bulletins', ''],
  absences:  ['Absences', 'Suivi de l\'assiduité'],
  agenda:    ['Emploi du temps', ''],
  codes:     ['Codes d\'accès parents', 'Gestion des accès'],
  stats:     ['Statistiques', 'Vue par classe'],
  params:    ['Paramètres', 'Configuration de l\'école'],
};

function navigate(page) {
  STATE.page = page;
  qq('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const [title, sub] = PAGE_META[page] || [page, ''];
  $('topbar-title').textContent = title;
  $('topbar-sub').textContent   = sub;
  const loaders = {
    dashboard: loadDashboard,
    eleves:    loadEleves,
    profs:     loadProfs,
    notes:     loadNotes,
    absences:  loadAbsences,
    agenda:    loadAgenda,
    codes:     loadCodes,
    stats:     loadStats,
    params:    loadParams,
  };
  $('main-content').innerHTML = loader();
  if (loaders[page]) loaders[page]();
}

// ══════════════════════════════════════════════════════════════
// ── DASHBOARD (adapté par rôle) ───────────────────────────────
// ══════════════════════════════════════════════════════════════
async function loadDashboard() {
  const data = await api('GET', '/dashboard');
  if (!data) return;
  const role = STATE.user.role;

  if (role === 'parent') {
    renderDashboardParent(data);
  } else if (role === 'professeur') {
    renderDashboardProfesseur(data);
  } else {
    renderDashboardDirecteur(data);
  }
}

function renderDashboardDirecteur(data) {
  const s = data.stats;
  $('main-content').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon navy">${icon('users')}</div><div class="stat-label">Total élèves</div><div class="stat-value">${s.total_eleves}</div><div class="stat-change stat-up">↑ ${s.eleves_actifs} actifs</div></div>
      <div class="stat-card"><div class="stat-icon gold">${icon('teacher')}</div><div class="stat-label">Professeurs</div><div class="stat-value">${s.total_profs}</div><div class="stat-change stat-up">↑ ${s.profs_actifs} actifs</div></div>
      <div class="stat-card"><div class="stat-icon success">${icon('home')}</div><div class="stat-label">Classes</div><div class="stat-value">${s.total_classes}</div></div>
      <div class="stat-card"><div class="stat-icon info">${icon('chart')}</div><div class="stat-label">Moy. générale</div><div class="stat-value">${s.moyenne_generale || '—'}</div><div class="stat-change stat-neutral">/ 20</div></div>
    </div>
    <div class="grid-2">
      <div class="table-container">
        <div class="table-header"><span class="table-title">Top 5 élèves</span></div>
        <table><thead><tr><th>Élève</th><th>Classe</th><th>Moy.</th></tr></thead><tbody>
          ${(data.top_eleves || []).map(e => `
            <tr>
              <td><span class="mini-av ${avColor(e.nom)}">${initials(e.nom,e.prenom)}</span>${e.prenom} ${e.nom}</td>
              <td><span class="badge badge-navy">${e.classe}</span></td>
              <td><strong class="${noteClass(e.moyenne)}">${e.moyenne}/20</strong></td>
            </tr>`).join('')}
        </tbody></table>
      </div>
      <div class="card">
        <div class="card-title">Alertes</div>
        ${(data.alertes || []).map(a => `
          <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
            <span class="badge badge-${a.type === 'warning' ? 'warning' : a.type === 'success' ? 'success' : 'info'}">${a.type}</span>
            <span style="font-size:13px">${a.message}</span>
          </div>`).join('')}
        <div style="margin-top:16px">
          <div class="card-title" style="margin-bottom:10px">Élèves par classe</div>
          ${Object.entries(data.repartition_classes || {}).map(([c,n]) => `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:12px">
              <span style="width:64px;color:var(--text-2)">${c}</span>
              <div class="progress-track" style="flex:1"><div class="progress-fill fill-green" style="width:${Math.min(100,Math.round(n/(Math.max(...Object.values(data.repartition_classes)))*100))}%"></div></div>
              <span style="color:var(--text-3);width:22px;text-align:right">${n}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function renderDashboardProfesseur(data) {
  const s = data.stats;
  $('main-content').innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card"><div class="stat-icon navy">${icon('notes')}</div><div class="stat-label">Notes saisies</div><div class="stat-value">${s.notes_saisies}</div></div>
      <div class="stat-card"><div class="stat-icon gold">${icon('alert')}</div><div class="stat-label">Absences enregistrées</div><div class="stat-value">${s.absences_enregistrees}</div></div>
      <div class="stat-card"><div class="stat-icon success">${icon('calendar')}</div><div class="stat-label">Créneaux / semaine</div><div class="stat-value">${s.creneaux_semaine}</div></div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-title">Mes classes</div>${(s.classes||[]).map(c=>`<span class="badge badge-navy" style="margin:3px">${c}</span>`).join('')||'<span class="text-muted">Aucune classe assignée</span>'}</div>
      <div class="card"><div class="card-title">Matières enseignées</div>${(s.matieres||[]).map(m=>`<span class="badge badge-gold" style="margin:3px">${m}</span>`).join('')||'<span class="text-muted">—</span>'}</div>
    </div>`;
}

function renderDashboardParent(data) {
  const eleves = data.eleves || [];
  $('main-content').innerHTML = `
    <div style="margin-bottom:20px">
      <div class="section-title">Mes enfants</div>
    </div>
    ${eleves.length === 0 ? '<div class="empty-state"><p>Aucun enfant lié à votre compte</p></div>' :
      eleves.map(e => `
        <div class="enfant-card" onclick="voirEnfant('${e._id}')">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:14px">
              <div class="mini-av ${avColor(e.nom)}" style="width:48px;height:48px;font-size:16px;border-radius:50%">${initials(e.nom,e.prenom)}</div>
              <div>
                <div class="enfant-name">${e.prenom} ${e.nom}</div>
                <div class="enfant-meta">${e.classe} · Matricule : ${e.matricule}</div>
                <div class="enfant-meta" style="margin-top:4px">${e.absences} absence(s) · Statut : <span class="badge badge-${e.statut==='actif'?'success':'warning'}">${e.statut}</span></div>
              </div>
            </div>
            <div>
              <div class="enfant-moy">${e.moyenne || '—'}</div>
              <div class="enfant-moy-label">/ 20</div>
              ${e.moyenne ? mention(e.moyenne) : ''}
            </div>
          </div>
        </div>`).join('')}`;
}

async function voirEnfant(id) {
  const data = await api('GET', `/eleves/${id}`);
  if (!data) return;
  $('modal-view-title').textContent = `${data.prenom} ${data.nom}`;
  $('modal-view-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div class="mini-av ${avColor(data.nom)}" style="width:52px;height:52px;font-size:18px;border-radius:50%">${initials(data.nom,data.prenom)}</div>
      <div>
        <div style="font-size:16px;font-weight:700">${data.prenom} ${data.nom}</div>
        <div class="text-muted text-sm">${data.matricule} · ${data.classe}</div>
        <div style="margin-top:6px">${mention(data.moyenne_generale)} <span class="text-sm text-muted">Moy. ${data.moyenne_generale||'—'}/20</span></div>
      </div>
    </div>
    <div class="card-title">Notes par matière</div>
    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-top:8px">
      <thead><tr style="background:var(--surface)"><th style="padding:8px;text-align:left">Matière</th><th style="padding:8px;text-align:right">Moyenne</th></tr></thead>
      <tbody>${(data.bulletin||[]).map(b=>`
        <tr style="border-top:1px solid var(--border)">
          <td style="padding:8px">${b.matiere}</td>
          <td style="padding:8px;text-align:right"><strong class="${noteClass(b.moyenne)}">${b.moyenne}/20</strong></td>
        </tr>`).join('')}</tbody>
    </table>
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="btn btn-primary" onclick="openBulletin('${id}');closeModal('modal-view')">${icon('notes')} Bulletin complet</button>
    </div>`;
  openModal('modal-view');
}

// ══════════════════════════════════════════════════════════════
// ── ÉLÈVES (directeur seulement) ──────────────────────────────
// ══════════════════════════════════════════════════════════════
let elevesPage = 1, elevesSearch = '', elevesClasse = '';

async function loadEleves() {
  await loadClasses();
  $('main-content').innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Liste des élèves</span>
        <div class="table-actions">
          <input class="form-input" id="search-eleve" placeholder="Rechercher..." oninput="debounce(searchEleves,400)()" style="width:200px">
          <select class="form-select" id="filter-classe" onchange="filterEleves()" style="width:150px">
            <option value="">Toutes les classes</option>
            ${STATE.classes.map(c=>`<option>${c}</option>`).join('')}
          </select>
          <button class="btn btn-primary" onclick="ouvrirFormEleve()">${icon('plus')} Inscrire un élève</button>
          <button class="btn btn-danger" onclick="supprimerTousEleves()">🗑️ Vider la liste</button>
        </div>
      </div>
      <div style="padding:0 20px 12px;display:flex;justify-content:flex-end"><button class="btn" onclick="exportPDF('eleves')">📄 Exporter PDF</button></div>
      <div id="eleves-body">${loader()}</div>
      <div class="table-footer"><span id="eleves-count">—</span><div class="pagination" id="eleves-pag"></div></div>
    </div>`;
  fetchEleves();
}

async function fetchEleves() {
  const p = new URLSearchParams({ page: elevesPage, limit: 15 });
  if (elevesSearch) p.set('search', elevesSearch);
  if (elevesClasse) p.set('classe', elevesClasse);
  try {
    const data = await api('GET', `/eleves?${p}`);
    if (!data) return;
    if (!data.data.length) {
      $('eleves-body').innerHTML = '<div class="empty-state"><p>Aucun élève trouvé</p></div>';
      return;
    }
    $('eleves-body').innerHTML = `<table>
      <thead><tr><th>Élève</th><th>Matricule</th><th>Classe</th><th>Moyenne</th><th>Statut</th><th></th></tr></thead>
      <tbody>${data.data.map(e=>`
        <tr>
          <td><span class="mini-av ${avColor(e.nom)}">${initials(e.nom,e.prenom)}</span>${e.prenom} ${e.nom}</td>
          <td class="text-muted text-sm">${e.matricule}</td>
          <td><span class="badge badge-navy">${e.classe}</span></td>
          <td><strong class="${noteClass(e.moyenne)}">${e.moyenne ? e.moyenne+'/20' : '—'}</strong></td>
          <td><span class="badge badge-${e.statut==='actif'?'success':'warning'}">${e.statut}</span></td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-icon" onclick="voirEleve('${e._id}')">${icon('eye')}</button>
              <button class="btn btn-sm btn-icon" onclick="editEleve('${e._id}')">${icon('edit')}</button>
              <button class="btn btn-sm btn-icon btn-danger" onclick="deleteEleve('${e._id}','${e.prenom} ${e.nom}')">${icon('trash')}</button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
    $('eleves-count').textContent = `${data.total} élève(s)`;
    renderPag('eleves-pag', data.page, Math.ceil(data.total/data.limit), p => { elevesPage = p; fetchEleves(); });
  } catch(e) { toast(e.message, 'error'); }
}

function searchEleves()  { elevesSearch = $('search-eleve')?.value||''; elevesPage=1; fetchEleves(); }
function filterEleves()  { elevesClasse = $('filter-classe')?.value||''; elevesPage=1; fetchEleves(); }

async function voirEleve(id) {
  const data = await api('GET', `/eleves/${id}`);
  if (!data) return;
  $('modal-view-title').textContent = `${data.prenom} ${data.nom}`;
  $('modal-view-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div class="mini-av ${avColor(data.nom)}" style="width:52px;height:52px;font-size:18px;border-radius:50%">${initials(data.nom,data.prenom)}</div>
      <div>
        <div style="font-size:16px;font-weight:700">${data.prenom} ${data.nom}</div>
        <div class="text-muted text-sm">${data.matricule} · ${data.classe} · ${data.sexe==='M'?'Masculin':'Féminin'}</div>
        <div style="margin-top:4px">${mention(data.moyenne_generale)}</div>
      </div>
    </div>
    <div class="grid-2" style="gap:8px;margin-bottom:16px">
      <div class="card" style="padding:12px"><div class="text-xs text-muted">Naissance</div><div class="text-sm">${fmtDate(data.date_naissance)}</div></div>
      <div class="card" style="padding:12px"><div class="text-xs text-muted">Classe</div><div class="text-sm">${data.classe}</div></div>
      <div class="card" style="padding:12px"><div class="text-xs text-muted">Absences</div><div class="text-sm">${data.absences?.length||0}</div></div>
      <div class="card" style="padding:12px"><div class="text-xs text-muted">Inscription</div><div class="text-sm">${fmtDate(data.date_inscription)}</div></div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="openBulletin('${id}');closeModal('modal-view')">${icon('notes')} Bulletin</button>
      <button class="btn" onclick="genererCode('${id}')">${icon('key')} Code parent</button>
    </div>`;
  openModal('modal-view');
}

function ouvrirFormEleve() {
  $('modal-eleve-title').textContent = 'Inscrire un élève';
  ['f-prenom','f-nom','f-lieu','f-adresse','f-parent','f-tel'].forEach(id => { if($(id)) $(id).value=''; });
  ['f-dob'].forEach(id => { if($(id)) $(id).value=''; });
  $('f-classe').innerHTML = `<option value="">Sélectionner...</option>${STATE.classes.map(c=>`<option>${c}</option>`).join('')}`;
  $('f-sexe').value = '';
  $('btn-save-eleve').onclick = () => saveEleve(null);
  openModal('modal-eleve');
}

async function editEleve(id) {
  const data = await api('GET', `/eleves/${id}`);
  if (!data) return;
  $('modal-eleve-title').textContent = 'Modifier l\'élève';
  $('f-prenom').value  = data.prenom || '';
  $('f-nom').value     = data.nom || '';
  $('f-classe').innerHTML = `<option value="">—</option>${STATE.classes.map(c=>`<option ${c===data.classe?'selected':''}>${c}</option>`).join('')}`;
  $('f-sexe').value    = data.sexe || '';
  $('f-dob').value     = data.date_naissance || '';
  $('f-lieu').value    = data.lieu_naissance || '';
  $('f-adresse').value = data.adresse || '';
  $('f-parent').value  = '';
  $('f-tel').value     = '';
  $('btn-save-eleve').onclick = () => saveEleve(id);
  openModal('modal-eleve');
}

async function saveEleve(id) {
  const body = {
    nom: $('f-nom').value.trim(), prenom: $('f-prenom').value.trim(),
    classe: $('f-classe').value, sexe: $('f-sexe').value,
    date_naissance: $('f-dob').value, lieu_naissance: $('f-lieu').value,
    adresse: $('f-adresse').value,
  };
  try {
    if (id) await api('PUT', `/eleves/${id}`, body);
    else    await api('POST', '/eleves', body);
    toast(id ? 'Élève mis à jour' : 'Élève inscrit', 'success');
    closeModal('modal-eleve');
    fetchEleves();
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteEleve(id, nom) {
  if (!confirm(`Supprimer l'élève ${nom} ? Ses notes et absences seront aussi supprimées.`)) return;
  try { await api('DELETE', `/eleves/${id}`); toast('Élève supprimé', 'success'); fetchEleves(); }
  catch(e) { toast(e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
// ── PROFESSEURS (directeur seulement) ────────────────────────
// ══════════════════════════════════════════════════════════════
async function loadProfs() {
  $('main-content').innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Corps enseignant</span>
        <div class="table-actions">
          <input class="form-input" id="search-prof" placeholder="Rechercher..." oninput="debounce(fetchProfs,400)()" style="width:200px">
          <button class="btn btn-primary" onclick="ouvrirFormProf()">${icon('plus')} Ajouter</button>
        </div>
      </div>
      <div id="profs-body">${loader()}</div>
    </div>`;
  fetchProfs();
}

async function fetchProfs() {
  const search = $('search-prof')?.value||'';
  const data = await api('GET', `/professeurs${search?`?search=${search}`:''}`);
  if (!data) return;
  $('profs-body').innerHTML = `<table>
    <thead><tr><th>Nom</th><th>Matière</th><th>Classes</th><th>Heures/sem.</th><th>Email</th><th>Statut</th><th></th></tr></thead>
    <tbody>${data.map(p=>`
      <tr>
        <td><span class="mini-av ${avColor(p.nom)}">${initials(p.nom,p.prenom)}</span>${p.prenom} ${p.nom}</td>
        <td><span class="badge badge-navy">${p.matiere}</span></td>
        <td class="text-sm text-muted">${(p.classes||[]).join(', ')||'—'}</td>
        <td>${p.heures_semaine||'—'}h</td>
        <td class="text-sm text-muted">${p.email}</td>
        <td><span class="badge badge-${p.statut==='actif'?'success':'warning'}">${p.statut}</span></td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-icon" onclick="editProf('${p._id}')">${icon('edit')}</button>
            <button class="btn btn-sm btn-icon btn-danger" onclick="deleteProf('${p._id}','${p.prenom} ${p.nom}')">${icon('trash')}</button>
          </div>
        </td>
      </tr>`).join('')}
    </tbody></table>`;
}

function ouvrirFormProf() {
  $('modal-prof-title').textContent = 'Ajouter un professeur';
  ['pf-prenom','pf-nom','pf-email','pf-password','pf-matiere','pf-heures','pf-tel'].forEach(id => { if($(id)) $(id).value=''; });
  $('pf-statut').value = 'actif';
  $('btn-save-prof').onclick = () => saveProf(null);
  openModal('modal-prof');
}

async function editProf(id) {
  const data = (await api('GET', `/professeurs`))?.find(p=>p._id===id);
  if (!data) return;
  $('modal-prof-title').textContent = 'Modifier le professeur';
  $('pf-prenom').value = data.prenom||''; $('pf-nom').value = data.nom||'';
  $('pf-email').value = data.email||''; $('pf-password').value = '';
  $('pf-matiere').value = data.matiere||''; $('pf-heures').value = data.heures_semaine||'';
  $('pf-tel').value = data.telephone||''; $('pf-statut').value = data.statut||'actif';
  $('btn-save-prof').onclick = () => saveProf(id);
  openModal('modal-prof');
}

async function saveProf(id) {
  const body = {
    nom: $('pf-nom').value.trim(), prenom: $('pf-prenom').value.trim(),
    email: $('pf-email').value.trim(), matiere: $('pf-matiere').value.trim(),
    heures_semaine: parseInt($('pf-heures').value)||0,
    telephone: $('pf-tel').value, statut: $('pf-statut').value,
  };
  const pwd = $('pf-password').value;
  if (pwd) body.password = pwd;
  if (!id && !pwd) { toast('Mot de passe requis pour un nouveau professeur', 'error'); return; }
  try {
    if (id) await api('PUT', `/professeurs/${id}`, body);
    else    await api('POST', '/professeurs', body);
    toast(id ? 'Professeur mis à jour' : 'Professeur ajouté', 'success');
    closeModal('modal-prof'); fetchProfs();
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteProf(id, nom) {
  if (!confirm(`Supprimer le professeur ${nom} ?`)) return;
  try { await api('DELETE', `/professeurs/${id}`); toast('Professeur supprimé', 'success'); fetchProfs(); }
  catch(e) { toast(e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
// ── NOTES ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
async function loadNotes() {
  const role = STATE.user.role;
  await loadClasses();
  if (role === 'parent') {
    loadNotesBulletins();
    return;
  }
  $('main-content').innerHTML = `
    <div class="tabs">
      <button class="tab active" onclick="switchTab(this,'ntab-saisie')">Saisie des notes</button>
      <button class="tab" onclick="switchTab(this,'ntab-bulletins')">Bulletins</button>
    </div>
    <div id="ntab-saisie">${loader()}</div>
    <div id="ntab-bulletins" style="display:none">${loader()}</div>`;
  loadNotesSaisie();
  loadNotesBulletins();
}

async function loadNotesSaisie() {
  const matieres = STATE.user.role === 'professeur'
    ? ['Mathématiques','Français','Sciences','Histoire-Géo','Anglais','EPS','Informatique']
    : ['Mathématiques','Français','Sciences','Histoire-Géo','Anglais','EPS','Arts','Informatique'];

  $('ntab-saisie').innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="form-row form-row-3">
        <div class="form-group"><label class="form-label">Classe</label>
          <select class="form-select" id="n-classe" onchange="loadNotesClasse()">
            <option value="">Sélectionner...</option>
            ${STATE.classes.map(c=>`<option>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Matière</label>
          <select class="form-select" id="n-matiere">
            ${matieres.map(m=>`<option>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Trimestre</label>
          <select class="form-select" id="n-trimestre"><option>T1</option><option>T2</option><option>T3</option></select>
        </div>
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-select" id="n-type"><option>Devoir surveillé</option><option>Contrôle continu</option><option>Examen</option></select>
        </div>
        <div class="form-group"><label class="form-label">Coefficient</label>
          <select class="form-select" id="n-coef"><option>1</option><option>2</option><option>3</option><option>4</option></select>
        </div>
        <div class="form-group" style="align-self:flex-end">
          <button class="btn btn-primary" onclick="loadNotesClasse()" style="width:100%">${icon('eye')} Charger</button>
        </div>
      </div>
    </div>
    <div id="notes-classe-table"><div class="empty-state"><p>Sélectionnez une classe</p></div></div>`;
}

async function loadNotesClasse() {
  const classe = $('n-classe').value;
  if (!classe) return;
  const data = await api('GET', `/eleves?classe=${encodeURIComponent(classe)}&limit=50`);
  if (!data?.data?.length) return;
  $('notes-classe-table').innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Classe ${classe} — ${data.data.length} élèves</span>
        <button class="btn btn-primary" onclick="saveNotesBulk()">${icon('check')} Valider toutes les notes</button>
      </div>
      <table>
        <thead><tr><th>Élève</th><th>Note /20</th><th>Appréciation</th></tr></thead>
        <tbody>${data.data.map(e=>`
          <tr>
            <td><span class="mini-av ${avColor(e.nom)}">${initials(e.nom,e.prenom)}</span>${e.prenom} ${e.nom}</td>
            <td><input class="form-input note-input" data-id="${e._id}" type="number" min="0" max="20" step="0.5" placeholder="—" style="width:80px"></td>
            <td><input class="form-input appr-input" data-id="${e._id}" placeholder="Appréciation..." style="width:240px"></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function saveNotesBulk() {
  const matiere = $('n-matiere').value;
  const trimestre = $('n-trimestre').value;
  const type = $('n-type').value;
  const coef = parseInt($('n-coef').value);
  const bulk = [];
  qq('.note-input').forEach((inp,i) => {
    const note = parseFloat(inp.value);
    if (!isNaN(note)) {
      bulk.push({ eleve: inp.dataset.id, matiere, trimestre, note, coefficient: coef, type, appreciation: qq('.appr-input')[i]?.value||'' });
    }
  });
  if (!bulk.length) { toast('Aucune note à enregistrer', 'warning'); return; }
  try {
    await api('POST', '/notes', bulk);
    toast(`${bulk.length} note(s) enregistrée(s)`, 'success');
  } catch(e) { toast(e.message, 'error'); }
}

async function loadNotesBulletins() {
  const role = STATE.user.role;
  let eleves;
  if (role === 'parent') {
    const data = await api('GET', '/dashboard');
    eleves = data?.eleves || [];
  } else {
    const data = await api('GET', `/eleves?limit=100`);
    eleves = data?.data || [];
  }
  const container = role === 'parent' ? $('main-content') : $('ntab-bulletins');
  if (!container) return;
  container.innerHTML = `
    <div class="table-container">
      <div class="table-header"><span class="table-title">Bulletins scolaires</span></div>
      <table>
        <thead><tr><th>Élève</th><th>Classe</th><th>Moyenne</th><th>Mention</th><th></th></tr></thead>
        <tbody>${eleves.map(e=>`
          <tr>
            <td><span class="mini-av ${avColor(e.nom)}">${initials(e.nom,e.prenom)}</span>${e.prenom} ${e.nom}</td>
            <td>${e.classe}</td>
            <td><strong class="${noteClass(e.moyenne)}">${e.moyenne||'—'}/20</strong></td>
            <td>${mention(e.moyenne)}</td>
            <td><button class="btn btn-sm" onclick="openBulletin('${e._id}')">${icon('eye')} Voir</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function openBulletin(id) {
  const data = await api(`GET`, `/notes/bulletin/${id}`);
  if (!data) return;
  $('modal-bulletin-body').innerHTML = `
    <div class="bulletin-header">
      <div>
        <div class="bulletin-school">École Excellence — Bulletin</div>
        <div class="bulletin-trimestre">Trimestre ${data.trimestre} · Édité le ${fmtDate(data.date_edition)}</div>
      </div>
      <div class="bulletin-eleve-info">
        <div style="font-weight:700">${data.eleve?.prenom} ${data.eleve?.nom}</div>
        <div>${data.eleve?.matricule}</div>
        <div>${data.eleve?.classe}</div>
      </div>
    </div>
    <div class="bulletin-body">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--surface)">
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:var(--text-3);border-bottom:1px solid var(--border)">Matière</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;color:var(--text-3);border-bottom:1px solid var(--border)">Moyenne</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:var(--text-3);border-bottom:1px solid var(--border)">Appréciation</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:var(--text-3);border-bottom:1px solid var(--border)">Professeur</th>
        </tr></thead>
        <tbody>${data.matieres.map(m=>`
          <tr style="border-bottom:1px solid var(--border)">
            <td style="padding:10px 16px;font-weight:600">${m.matiere}</td>
            <td style="padding:10px 16px;text-align:center"><strong class="${noteClass(m.moyenne)}">${m.moyenne}/20</strong></td>
            <td style="padding:10px 16px;font-size:12px;color:var(--text-2)">${m.appreciation||'—'}</td>
            <td style="padding:10px 16px;font-size:12px;color:var(--text-2)">${m.prof}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="bulletin-summary">
        <div><div class="text-xs text-muted">Moyenne générale</div><div class="bulletin-moy-val">${data.moyenne_generale}/20</div></div>
        <div><div class="text-xs text-muted">Mention</div><div style="margin-top:4px">${mention(data.moyenne_generale)}</div></div>
        <div><div class="text-xs text-muted">Absences</div><div style="font-size:20px;font-weight:700;color:var(--warning)">${data.absences}</div></div>
      </div>
    </div>`;
  openModal('modal-bulletin');
}

// ══════════════════════════════════════════════════════════════
// ── ABSENCES ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
async function loadAbsences() {
  const role = STATE.user.role;
  $('main-content').innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Absences</span>
        ${role !== 'parent' ? `<button class="btn btn-primary" onclick="ouvrirFormAbsence()">${icon('plus')} Enregistrer</button><button class="btn" onclick="exportPDF('absences')">📄 PDF</button>` : ''}
      </div>
      <div id="absences-body">${loader()}</div>
    </div>`;
  fetchAbsences();
}

async function fetchAbsences() {
  const data = await api('GET', '/absences');
  if (!data) return;
  if (!data.length) { $('absences-body').innerHTML = '<div class="empty-state"><p>Aucune absence enregistrée</p></div>'; return; }
  const role = STATE.user.role;
  $('absences-body').innerHTML = `<table>
    <thead><tr><th>Élève</th><th>Classe</th><th>Date</th><th>Cours</th><th>Justifiée</th>${role !== 'parent' ? '<th></th>' : ''}</tr></thead>
    <tbody>${data.map(a=>`
      <tr>
        <td>${a.eleve ? `<span class="mini-av ${avColor(a.eleve.nom)}">${initials(a.eleve.nom,a.eleve.prenom)}</span>${a.eleve.prenom} ${a.eleve.nom}` : '—'}</td>
        <td><span class="badge badge-navy">${a.eleve?.classe||'—'}</span></td>
        <td>${fmtDate(a.date)}</td>
        <td>${a.cours||'—'}</td>
        <td><span class="badge badge-${a.justifiee?'success':'danger'}">${a.justifiee?'Oui':'Non'}</span></td>
        ${role !== 'parent' ? `<td>${!a.justifiee ? `<button class="btn btn-sm btn-gold" onclick="justifierAbsence('${a._id}')">Justifier</button>` : ''}</td>` : ''}
      </tr>`).join('')}
    </tbody></table>`;
}

async function ouvrirFormAbsence() {
  $('abs-date').value = new Date().toISOString().split('T')[0];
  $('abs-cours').value = ''; $('abs-motif').value = '';
  const eleves = await api('GET', '/eleves?limit=200');
  $('abs-eleve').innerHTML = `<option value="">Sélectionner...</option>${(eleves?.data||[]).map(e=>`<option value="${e._id}">${e.prenom} ${e.nom} (${e.classe})</option>`).join('')}`;
  openModal('modal-absence');
}

async function saveAbsence() {
  const body = { eleve: $('abs-eleve').value, date: $('abs-date').value, cours: $('abs-cours').value, motif: $('abs-motif').value };
  if (!body.eleve) { toast('Sélectionner un élève', 'error'); return; }
  try { await api('POST', '/absences', body); toast('Absence enregistrée', 'success'); closeModal('modal-absence'); fetchAbsences(); }
  catch(e) { toast(e.message, 'error'); }
}

async function justifierAbsence(id) {
  try { await api('PUT', `/absences/${id}`, { justifiee: true }); toast('Absence justifiée', 'success'); fetchAbsences(); }
  catch(e) { toast(e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
// ── EMPLOI DU TEMPS ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
async function loadAgenda() {
  await loadClasses();
  const role = STATE.user.role;
  $('main-content').innerHTML = `
    <div class="section-header">
      <div style="display:flex;gap:8px">
        ${role === 'directeur' ? `<select class="form-select" id="edt-classe" onchange="fetchEDT()" style="width:160px"><option value="">Toutes les classes</option>${STATE.classes.map(c=>`<option>${c}</option>`).join('')}</select>` : ''}
      </div>
      ${role === 'directeur' ? `<button class="btn btn-primary" onclick="ouvrirFormEDT()">${icon('plus')} Ajouter un créneau</button>` : ''}
      <button class="btn" onclick="exportPDF('edt')">📄 PDF</button>
    </div>
    <div class="table-container"><div id="edt-content">${loader()}</div></div>`;
  fetchEDT();
}

async function fetchEDT() {
  const classe = $('edt-classe')?.value||'';
  const params = new URLSearchParams();
  if (classe) params.set('classe', classe);
  const data = await api('GET', `/emploi-du-temps?${params}`);
  if (!data) return;

  const jours = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
  const crens  = ['07:30-09:30','09:30-11:30','11:30-13:30','13:30-15:30','15:30-17:30'];
  const map = {};
  data.forEach(s => {
    if (!map[s.creneau]) map[s.creneau] = {};
    if (!map[s.creneau][s.jour]) map[s.creneau][s.jour] = [];
    map[s.creneau][s.jour].push(s);
  });

  $('edt-content').innerHTML = `
    <div class="edt-grid">
      <table class="edt-table">
        <thead><tr><th>Horaire</th>${jours.map(j=>`<th>${j}</th>`).join('')}</tr></thead>
        <tbody>${crens.map(c=>`
          <tr>
            <td>${c}</td>
            ${jours.map(j=>`
              <td>${(map[c]?.[j]||[]).map(s=>`
                <div class="edt-slot">
                  <strong>${s.matiere}</strong>
                  ${s.salle ? `Salle ${s.salle}<br>` : ''}
                  <span style="opacity:.7">${s.professeur?.prenom||''} ${s.professeur?.nom||''}</span>
                  ${!classe ? `<br><span class="badge badge-navy">${s.classe}</span>` : ''}
                  ${STATE.user.role==='directeur' ? `<br><button class="btn btn-sm btn-danger" style="margin-top:4px;padding:2px 6px;font-size:10px" onclick="deleteSlot('${s._id}')">Suppr.</button>` : ''}
                </div>`).join('')||''}
              </td>`).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function ouvrirFormEDT() {
  const profs = await api('GET', '/professeurs');
  $('edt-f-prof').innerHTML = `<option value="">—</option>${(profs||[]).map(p=>`<option value="${p._id}">${p.prenom} ${p.nom} (${p.matiere})</option>`).join('')}`;
  $('edt-f-classe').innerHTML = `<option value="">—</option>${STATE.classes.map(c=>`<option>${c}</option>`).join('')}`;
  openModal('modal-edt');
}

async function saveSlotEDT() {
  const body = { classe: $('edt-f-classe').value, professeur: $('edt-f-prof').value, jour: $('edt-f-jour').value, creneau: $('edt-f-creneau').value, salle: $('edt-f-salle').value };
  const prof = (await api('GET', '/professeurs'))?.find(p=>p._id===body.professeur);
  if (prof) body.matiere = prof.matiere;
  try { await api('POST', '/emploi-du-temps', body); toast('Créneau ajouté', 'success'); closeModal('modal-edt'); fetchEDT(); }
  catch(e) { toast(e.message, 'error'); }
}

async function deleteSlot(id) {
  if (!confirm('Supprimer ce créneau ?')) return;
  try { await api('DELETE', `/emploi-du-temps/${id}`); toast('Créneau supprimé', 'success'); fetchEDT(); }
  catch(e) { toast(e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
// ── CODES D'ACCÈS PARENTS (directeur) ─────────────────────────
// ══════════════════════════════════════════════════════════════
let codeElevesChoisis = [];

async function loadCodes() {
  const data = await api('GET', '/codes-acces');
  $('main-content').innerHTML = `
    <div class="section-header">
      <span class="section-title">Codes d'accès générés</span>
      <button class="btn btn-primary" onclick="ouvrirModalCode()">${icon('plus')} Générer un code</button>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>Code</th><th>Élève(s) lié(s)</th><th>Utilisé</th><th>Expire le</th><th></th></tr></thead>
        <tbody>${(data||[]).map(c=>`
          <tr>
            <td><span class="code-badge" style="font-size:14px;padding:6px 12px;letter-spacing:2px">${c.code}</span></td>
            <td>${(c.eleves||[]).map(e=>`<span class="badge badge-navy" style="margin:2px">${e.prenom||''} ${e.nom||''}</span>`).join('')}</td>
            <td><span class="badge badge-${c.utilise?'success':'warning'}">${c.utilise?'Oui':'Non'}</span></td>
            <td class="text-sm text-muted">${fmtDate(c.expire_le)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteCode('${c._id}')">${icon('trash')}</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function ouvrirModalCode() {
  codeElevesChoisis = [];
  $('code-resultat').style.display = 'none';
  $('code-eleves-selectionnes').innerHTML = '';
  const eleves = await api('GET', '/eleves?limit=200');
  $('code-eleve-select').innerHTML = `<option value="">Sélectionner un élève...</option>${(eleves?.data||[]).map(e=>`<option value="${e._id}">${e.prenom} ${e.nom} (${e.classe})</option>`).join('')}`;
  $('code-eleve-select').onchange = function() {
    const id = this.value;
    const txt = this.options[this.selectedIndex].text;
    if (id && !codeElevesChoisis.find(e=>e.id===id)) {
      codeElevesChoisis.push({ id, txt });
      renderCodeEleves();
    }
    this.value = '';
  };
  $('btn-gen-code').onclick = genererCodePourEleves;
  openModal('modal-code');
}

function renderCodeEleves() {
  $('code-eleves-selectionnes').innerHTML = codeElevesChoisis.map(e=>`
    <span class="badge badge-navy" style="cursor:pointer" onclick="retirerEleveCode('${e.id}')">
      ${e.txt} ×
    </span>`).join('');
}

function retirerEleveCode(id) {
  codeElevesChoisis = codeElevesChoisis.filter(e=>e.id!==id);
  renderCodeEleves();
}

async function genererCodePourEleves() {
  if (!codeElevesChoisis.length) { toast('Sélectionnez au moins un élève', 'error'); return; }
  try {
    const data = await api('POST', '/codes-acces', { eleves: codeElevesChoisis.map(e=>e.id) });
    $('code-valeur').textContent = data.code;
    $('code-resultat').style.display = 'block';
    $('btn-gen-code').textContent = 'Généré ✓';
    $('btn-gen-code').disabled = true;
    setTimeout(() => { $('btn-gen-code').textContent = 'Générer le code'; $('btn-gen-code').disabled = false; }, 3000);
    loadCodes();
  } catch(e) { toast(e.message, 'error'); }
}

async function genererCode(eleveId) {
  closeModal('modal-view');
  codeElevesChoisis = [{ id: eleveId, txt: 'Élève sélectionné' }];
  await ouvrirModalCode();
  renderCodeEleves();
}

async function deleteCode(id) {
  if (!confirm('Supprimer ce code ?')) return;
  try { await api('DELETE', `/codes-acces/${id}`); toast('Code supprimé', 'success'); loadCodes(); }
  catch(e) { toast(e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
// ── STATS (directeur) ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
async function loadStats() {
  const data = await api('GET', '/stats/classes');
  if (!data) return;
  $('main-content').innerHTML = `
    <div class="grid-3">
      ${data.map(c=>`
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div>
              <div style="font-size:17px;font-weight:700;color:var(--navy)">${c.classe}</div>
              <div class="text-sm text-muted">${c.nb_eleves} élèves</div>
            </div>
            <span class="badge badge-${parseFloat(c.moyenne)>=12?'success':parseFloat(c.moyenne)>=10?'warning':'danger'}">${c.moyenne||'—'}/20</span>
          </div>
          <div class="progress-bar">
            <div class="progress-track"><div class="progress-fill ${parseFloat(c.moyenne)>=12?'fill-green':parseFloat(c.moyenne)>=10?'fill-amber':'fill-red'}" style="width:${Math.min(100,Math.round((parseFloat(c.moyenne)||0)/20*100))}%"></div></div>
            <span class="text-xs text-muted">${Math.round((parseFloat(c.moyenne)||0)/20*100)}%</span>
          </div>
          <div class="text-xs text-muted mt-2">${c.nb_notes} notes enregistrées</div>
        </div>`).join('')}
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// ── PARAMÈTRES (directeur) ────────────────────────────────────
// ══════════════════════════════════════════════════════════════
async function loadParams() {
  const data = await api('GET', '/parametres');
  if (!data) return;
  $('main-content').innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Informations de l'établissement</div>
        <div class="form-group"><label class="form-label">Nom de l'école</label><input class="form-input" id="p-nom" value="${data.nom||''}"></div>
        <div class="form-group"><label class="form-label">Adresse</label><input class="form-input" id="p-adresse" value="${data.adresse||''}"></div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Téléphone</label><input class="form-input" id="p-tel" value="${data.telephone||''}"></div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="p-email" value="${data.email||''}"></div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Année scolaire</label><input class="form-input" id="p-annee" value="${data.annee_scolaire||''}"></div>
          <div class="form-group"><label class="form-label">Notation (sur)</label>
            <select class="form-select" id="p-notation">
              <option value="20" ${data.systeme_notation==20?'selected':''}>20</option>
              <option value="100" ${data.systeme_notation==100?'selected':''}>100</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Classes de l'école (une par ligne)</label>
          <textarea class="form-textarea" id="p-classes">${(data.classes||[]).join('\n')}</textarea>
        </div>
        <button class="btn btn-primary" onclick="saveParams()">${icon('check')} Sauvegarder</button>
      </div>
      <div class="card">
        <div class="card-title">Mot de passe directeur</div>
        <div class="form-group"><label class="form-label">Ancien mot de passe</label><input class="form-input" id="pw-ancien" type="password" placeholder="••••••••"></div>
        <div class="form-group"><label class="form-label">Nouveau mot de passe</label><input class="form-input" id="pw-nouveau" type="password" placeholder="••••••••"></div>
        <button class="btn btn-primary" onclick="changePassword()">${icon('key')} Changer le mot de passe</button>
      </div>
    </div>`;
}

async function saveParams() {
  const classesText = $('p-classes').value;
  const classes = classesText.split('\n').map(c=>c.trim()).filter(Boolean);
  const body = {
    nom: $('p-nom').value, adresse: $('p-adresse').value,
    telephone: $('p-tel').value, email: $('p-email').value,
    annee_scolaire: $('p-annee').value,
    systeme_notation: parseInt($('p-notation').value),
    classes
  };
  try {
    await api('PUT', '/parametres', body);
    STATE.classes = classes;
    toast('Paramètres sauvegardés', 'success');
    $('annee-label').textContent = body.annee_scolaire;
  } catch(e) { toast(e.message, 'error'); }
}

async function changePassword() {
  const ancien = $('pw-ancien').value;
  const nouveau = $('pw-nouveau').value;
  if (!ancien || !nouveau) { toast('Remplissez les deux champs', 'error'); return; }
  try {
    await api('PUT', '/me/password', { ancien, nouveau });
    toast('Mot de passe mis à jour', 'success');
    $('pw-ancien').value = ''; $('pw-nouveau').value = '';
  } catch(e) { toast(e.message, 'error'); }
}

// ── Helpers communs ───────────────────────────────────────────
async function loadClasses() {
  if (STATE.classes.length) return;
  try {
    const dir = await api('GET', '/parametres');
    if (dir?.classes?.length) { STATE.classes = dir.classes; return; }
    // Fallback : déduire depuis les élèves
    const stats = await api('GET', '/stats/classes');
    STATE.classes = (stats||[]).map(c=>c.classe).sort();
  } catch { STATE.classes = ['6ème A','6ème B','5ème A','5ème B','4ème A','4ème B','3ème A','3ème B']; }
}

function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

function switchTab(el, contentId) {
  el.closest('.main')?.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  $('main-content')?.querySelectorAll('[id^="ntab-"]').forEach(t=>t.style.display='none');
  const target = $(contentId);
  if (target) target.style.display = 'block';
}

function renderPag(containerId, current, total, onClick) {
  const el = $(containerId);
  if (!el || total <= 1) return;
  let html = `<button class="page-btn" ${current<=1?'disabled':''} onclick="(${onClick.toString()})(${current-1})">‹</button>`;
  for (let i=1; i<=Math.min(total,7); i++) html += `<button class="page-btn ${i===current?'active':''}" onclick="(${onClick.toString()})(${i})">${i}</button>`;
  html += `<button class="page-btn" ${current>=total?'disabled':''} onclick="(${onClick.toString()})(${current+1})">›</button>`;
  el.innerHTML = html;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Session persistante
  if (STATE.token && STATE.user) {
    $('login-screen').style.display = 'none';
    $('app').classList.add('visible');
    document.body.className = `role-${STATE.user.role}`;
    renderSidebar();
    renderUserChip();
    navigate('dashboard');
  }

  $('login-password')?.addEventListener('keypress', e => { if (e.key==='Enter') login(); });
  $('btn-login')?.addEventListener('click', login);
  $('btn-register')?.addEventListener('click', register);

  // Fermer modals sur backdrop
  qq('.modal-backdrop').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });

  // Recherche topbar
  $('topbar-search-input')?.addEventListener('input', e => {
    const q = e.target.value;
    if (STATE.page === 'eleves' && $('search-eleve')) {
      $('search-eleve').value = q; searchEleves();
    }
  });
});

// ══════════════════════════════════════════════════════════════
// ── EXPORT PDF (utilise window.print avec styles dédiés) ──────
// ══════════════════════════════════════════════════════════════
function exportPDF(type, id) {
  let html = '';
  if (type === 'bulletin') {
    const body = document.getElementById('modal-bulletin-body');
    if (!body) { toast('Ouvrez d\'abord le bulletin', 'error'); return; }
    html = body.innerHTML;
  } else if (type === 'eleves') {
    const table = document.querySelector('#eleves-body table');
    if (!table) { toast('Chargez d\'abord la liste', 'error'); return; }
    html = `<h2 style="font-family:sans-serif;margin-bottom:16px">Liste des élèves</h2>` + table.outerHTML;
  } else if (type === 'absences') {
    const table = document.querySelector('#absences-body table');
    if (!table) { toast('Chargez d\'abord les absences', 'error'); return; }
    html = `<h2 style="font-family:sans-serif;margin-bottom:16px">Absences</h2>` + table.outerHTML;
  } else if (type === 'edt') {
    const table = document.querySelector('.edt-table');
    if (!table) { toast('Chargez d\'abord l\'emploi du temps', 'error'); return; }
    html = `<h2 style="font-family:sans-serif;margin-bottom:16px">Emploi du temps</h2>` + table.outerHTML;
  }

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Export — École Excellence</title>
    <style>
      body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 32px; color: #111; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #0d1e3d; color: #fff; padding: 10px 14px; font-size: 12px; text-align: left; }
      td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e2e6f0; }
      tr:hover td { background: #f7f8fc; }
      .bulletin-header { background: #0d1e3d; color: #fff; padding: 24px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; }
      .bulletin-school { font-size: 18px; font-weight: 700; }
      .bulletin-trimestre { font-size: 12px; opacity: 0.6; margin-top: 3px; }
      .bulletin-eleve-info { text-align: right; font-size: 13px; opacity: 0.85; }
      .bulletin-body { border: 1px solid #e2e6f0; border-top: none; border-radius: 0 0 10px 10px; }
      .bulletin-summary { display: flex; gap: 20px; padding: 16px 24px; background: #f7f8fc; border-top: 1px solid #e2e6f0; }
      .bulletin-moy-val { font-size: 32px; font-weight: 700; color: #0d1e3d; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
      .badge-success { background: #ecfdf5; color: #059669; }
      .badge-warning { background: #fffbeb; color: #d97706; }
      .badge-danger  { background: #fef2f2; color: #dc2626; }
      .badge-navy    { background: rgba(13,30,61,0.1); color: #0d1e3d; }
      .badge-gold    { background: #fff8e6; color: #d4920a; }
      .badge-info    { background: #eff6ff; color: #2563eb; }
      .text-success { color: #059669; }
      .text-warning { color: #d97706; }
      .text-danger  { color: #dc2626; }
      h2 { color: #0d1e3d; }
      @media print { body { padding: 16px; } }
    </style>
    </head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #0d1e3d;padding-bottom:12px">
      <div style="font-size:20px;font-weight:700;color:#0d1e3d">🏫 École Excellence</div>
      <div style="font-size:12px;color:#9ca3af">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
    ${html}
    <script>window.onload = function(){ window.print(); }<\/script>
    </body></html>`);
  win.document.close();
}

// ══════════════════════════════════════════════════════════════
// ── SUPPRIMER TOUS LES ÉLÈVES ─────────────────────────────────
// ══════════════════════════════════════════════════════════════
async function supprimerTousEleves() {
  const confirmation = prompt(
    '⚠️ ATTENTION — Cette action supprimera TOUS les élèves, leurs notes et absences.\n\n' +
    'Tapez "CONFIRMER" pour continuer :'
  );
  if (confirmation !== 'CONFIRMER') {
    toast('Suppression annulée', 'warning');
    return;
  }
  try {
    const eleves = await api('GET', '/eleves?limit=500');
    const liste = eleves?.data || [];
    if (!liste.length) { toast('Aucun élève à supprimer', 'warning'); return; }
    let count = 0;
    for (const e of liste) {
      await api('DELETE', `/eleves/${e._id}`);
      count++;
    }
    toast(`✅ ${count} élève(s) supprimé(s)`, 'success');
    fetchEleves();
  } catch(e) { toast(e.message, 'error'); }
}

// ── Sidebar mobile toggle ─────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}


// ══════════════════════════════════════════════════════════════
// ── EXPORT PDF ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
function exportPDF(type) {
  let html = '';
  if (type === 'bulletin') {
    const body = document.getElementById('modal-bulletin-body');
    if (!body) { toast('Ouvrez d\'abord le bulletin', 'error'); return; }
    html = body.innerHTML;
  } else if (type === 'eleves') {
    const table = document.querySelector('#eleves-body table');
    if (!table) { toast('Chargez d\'abord la liste', 'error'); return; }
    html = `<h2 style="font-family:sans-serif;margin-bottom:16px">Liste des élèves</h2>` + table.outerHTML;
  } else if (type === 'absences') {
    const table = document.querySelector('#absences-body table');
    if (!table) { toast('Chargez d\'abord les absences', 'error'); return; }
    html = `<h2 style="font-family:sans-serif;margin-bottom:16px">Absences</h2>` + table.outerHTML;
  } else if (type === 'edt') {
    const table = document.querySelector('.edt-table');
    if (!table) { toast('Chargez d\'abord l\'emploi du temps', 'error'); return; }
    html = `<h2 style="font-family:sans-serif;margin-bottom:16px">Emploi du temps</h2>` + table.outerHTML;
  }

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>Export — École Excellence</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #0d1e3d; color: #fff; padding: 10px 14px; font-size: 12px; text-align: left; }
      td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e2e6f0; }
      .bulletin-header { background: #0d1e3d; color: #fff; padding: 24px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; }
      .bulletin-school { font-size: 18px; font-weight: 700; }
      .bulletin-trimestre { font-size: 12px; opacity: 0.6; margin-top: 3px; }
      .bulletin-eleve-info { text-align: right; font-size: 13px; opacity: 0.85; }
      .bulletin-body { border: 1px solid #e2e6f0; border-top: none; }
      .bulletin-summary { display: flex; gap: 20px; padding: 16px 24px; background: #f7f8fc; border-top: 1px solid #e2e6f0; }
      .bulletin-moy-val { font-size: 32px; font-weight: 700; color: #0d1e3d; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
      .badge-success { background: #ecfdf5; color: #059669; }
      .badge-warning { background: #fffbeb; color: #d97706; }
      .badge-danger  { background: #fef2f2; color: #dc2626; }
      .badge-navy    { background: #e8ecf5; color: #0d1e3d; }
      .badge-gold    { background: #fff8e6; color: #d4920a; }
      .badge-info    { background: #eff6ff; color: #2563eb; }
      .text-success { color: #059669; } .text-warning { color: #d97706; } .text-danger { color: #dc2626; }
      .mini-av { display: none; }
      @media print { body { padding: 16px; } }
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #0d1e3d;padding-bottom:12px">
      <div style="font-size:20px;font-weight:700;color:#0d1e3d">🏫 École Excellence</div>
      <div style="font-size:12px;color:#9ca3af">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
    ${html}
    <script>window.onload=function(){window.print();}<\/script>
    </body></html>`);
  win.document.close();
}

// ══════════════════════════════════════════════════════════════
// ── SUPPRIMER TOUS LES ÉLÈVES ─────────────────────────────────
// ══════════════════════════════════════════════════════════════
async function supprimerTousEleves() {
  const confirmation = prompt(
    '⚠️ ATTENTION — Cette action supprimera TOUS les élèves, leurs notes et absences.\n\nTapez "CONFIRMER" pour continuer :'
  );
  if (confirmation !== 'CONFIRMER') { toast('Suppression annulée', 'warning'); return; }
  try {
    const eleves = await api('GET', '/eleves?limit=500');
    const liste = eleves?.data || [];
    if (!liste.length) { toast('Aucun élève à supprimer', 'warning'); return; }
    let count = 0;
    for (const e of liste) { await api('DELETE', `/eleves/${e._id}`); count++; }
    toast(`✅ ${count} élève(s) supprimé(s)`, 'success');
    fetchEleves();
  } catch(e) { toast(e.message, 'error'); }
}

// ── Sidebar mobile toggle ─────────────────────────────────────
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}