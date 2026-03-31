import { v4 as uuidv4 } from 'uuid';
import { CHANTIERS_SEED, ENTREPRISES_SEED, TACHES_SEED, DEVIS_SEED } from '../data/seed.js';

let _db = null;

function getDB() {
    if (!_db) {
          _db = {
                  chantiers: JSON.parse(JSON.stringify(CHANTIERS_SEED)),
                  entreprises: JSON.parse(JSON.stringify(ENTREPRISES_SEED)),
                  taches: JSON.parse(JSON.stringify(TACHES_SEED)),
                  devis: JSON.parse(JSON.stringify(DEVIS_SEED)),
          };
    }
    return _db;
}

// ---------- Chantiers ----------
export function getChantiers() {
    return getDB().chantiers;
}

export function getChantier(id) {
    return getDB().chantiers.find(c => c.id === id) || null;
}

export function createChantier(data) {
    const db = getDB();
    const chantier = {
          id: 'ch-' + uuidv4().slice(0, 8),
          nom: data.nom,
          site: data.site || 'HEGP',
          statut: data.statut || 'En attente',
          budget_ht: parseFloat(data.budget_ht) || 0,
          budget_ttc: parseFloat(data.budget_ttc) || 0,
          description: data.description || '',
          date_debut: data.date_debut || '',
          date_fin_prevue: data.date_fin_prevue || '',
          responsable: data.responsable || '',
          intervenants: data.intervenants || [],
          zones: data.zones || [],
    };
    db.chantiers.push(chantier);
    return chantier;
}

export function updateChantierStatut(id, statut) {
    const db = getDB();
    const idx = db.chantiers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    db.chantiers[idx].statut = statut;
    return db.chantiers[idx];
}

export function updateChantier(id, data) {
    const db = getDB();
    const idx = db.chantiers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    db.chantiers[idx] = { ...db.chantiers[idx], ...data };
    return db.chantiers[idx];
}

export function deleteChantier(id) {
    const db = getDB();
    const idx = db.chantiers.findIndex(c => c.id === id);
    if (idx === -1) return false;
    db.chantiers.splice(idx, 1);
    db.taches = db.taches.filter(t => t.chantier_id !== id);
    db.devis = db.devis.filter(d => d.chantier_id !== id);
    return true;
}

// ---------- Taches ----------
export function getTaches(chantier_id) {
    const db = getDB();
    let taches = db.taches;
    if (chantier_id) taches = taches.filter(t => t.chantier_id === chantier_id);
    return taches.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
}

export function createTache(data) {
    const db = getDB();
    const zoneTaches = db.taches.filter(t => t.chantier_id === data.chantier_id && t.zone === data.zone);
    const maxOrdre = zoneTaches.reduce((m, t) => Math.max(m, t.ordre || 0), 0);
    const tache = {
          id: 't-' + uuidv4().slice(0, 8),
          chantier_id: data.chantier_id,
          zone: data.zone,
          type_tache: data.type_tache || 'Pose',
          description: data.description || '',
          statut: data.statut || 'A faire',
          entreprise_id: data.entreprise_id || '',
          entreprise_nom: data.entreprise_nom || '',
          date_echeance: data.date_echeance || '',
          ordre: maxOrdre + 1,
          duree_jours: parseInt(data.duree_jours) || 1,
    };
    db.taches.push(tache);
    updateAvancement(db, data.chantier_id);
    return tache;
}

export function updateTacheStatut(id, statut) {
    const db = getDB();
    const idx = db.taches.findIndex(t => t.id === id);
    if (idx === -1) return null;
    db.taches[idx].statut = statut;
    updateAvancement(db, db.taches[idx].chantier_id);
    return db.taches[idx];
}

export function updateTacheDuree(id, duree_jours) {
    const db = getDB();
    const idx = db.taches.findIndex(t => t.id === id);
    if (idx === -1) return null;
    db.taches[idx].duree_jours = parseInt(duree_jours) || 1;
    return db.taches[idx];
}

export function deleteTache(id) {
    const db = getDB();
    const idx = db.taches.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const chantier_id = db.taches[idx].chantier_id;
    db.taches.splice(idx, 1);
    updateAvancement(db, chantier_id);
    return true;
}

export function reorderTaches(chantier_id, zone, ordered_ids) {
    const db = getDB();
    ordered_ids.forEach((tid, i) => {
          const idx = db.taches.findIndex(t => t.id === tid);
          if (idx !== -1) db.taches[idx].ordre = i + 1;
    });
    return db.taches.filter(t => t.chantier_id === chantier_id && t.zone === zone)
      .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
}

function updateAvancement(db, chantier_id) {
    const chIdx = db.chantiers.findIndex(c => c.id === chantier_id);
    if (chIdx === -1) return;
    const chantier = db.chantiers[chIdx];
    const allTaches = db.taches.filter(t => t.chantier_id === chantier_id);
    chantier.zones = chantier.zones.map(zone => {
          const zoneTaches = allTaches.filter(t => t.zone === zone.nom);
          if (zoneTaches.length === 0) return zone;
          const done = zoneTaches.filter(t => t.statut === 'Termine').length;
          return { ...zone, avancement: Math.round((done / zoneTaches.length) * 100) };
    });
}

// ---------- Devis ----------
export function getDevis(chantier_id) {
    const db = getDB();
    let devis = db.devis;
    if (chantier_id) devis = devis.filter(d => d.chantier_id === chantier_id);
    return devis;
}

export function createDevis(data) {
    const db = getDB();
    const devis = {
          id: 'd-' + uuidv4().slice(0, 8),
          chantier_id: data.chantier_id,
          entreprise_id: data.entreprise_id || '',
          entreprise_nom: data.entreprise_nom || '',
          montant_ht: parseFloat(data.montant_ht) || 0,
          montant_ttc: parseFloat(data.montant_ttc) || 0,
          description: data.description || '',
          date_reception: data.date_reception || '',
          statut: data.statut || 'En attente',
          n_devis: data.n_devis || '',
    };
    db.devis.push(devis);
    return devis;
}

// ---------- Entreprises ----------
export function getEntreprises() {
    return getDB().entreprises;
}

// ---------- Stats ----------
export function getStats() {
    const db = getDB();
    const chantiers = db.chantiers;
    const taches = db.taches;
    const devis = db.devis;
    const budgetTotal = chantiers.reduce((s, c) => s + (c.budget_ttc || 0), 0);
    const enCours = chantiers.filter(c => c.statut === 'En cours').length;
    const bloques = chantiers.filter(c => c.statut === 'Bloque').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const retards = taches.filter(t => {
          if (!t.date_echeance || t.statut === 'Termine') return false;
          return new Date(t.date_echeance) < today;
    }).length;
    const tachesTotal = taches.length;
    const avancementGlobal = chantiers.length ? Math.round(chantiers.reduce((s, c) => {
          const zones = c.zones || [];
          if (!zones.length) return s;
          const avg = zones.reduce((a, z) => a + (z.avancement || 0), 0) / zones.length;
          return s + avg;
    }, 0) / chantiers.length) : 0;
    return {
          total_chantiers: chantiers.length,
          en_cours: enCours,
          bloques,
          budget_total_ttc: budgetTotal,
          retards,
          taches_total: tachesTotal,
      avancement_global: avancementGlobal,
    };
}

// ---------- Alertes ----------
export function getAlertes() {
    const db = getDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const retards = db.taches.filter(t => {
          if (!t.date_echeance || t.statut === 'Termine') return false;
          return new Date(t.date_echeance) < today;
    });
    const bloques = db.taches.filter(t => t.statut === 'Bloque');
    const chantiers_bloques = db.chantiers.filter(c => c.statut === 'Bloque');
    return { retards, bloques, chantiers_bloques };
}

// ---------- Relances ----------
export function genererRelance(tache_ids) {
    const db = getDB();
    const taches = db.taches.filter(t => tache_ids.includes(t.id));
    const byEntreprise = {};
    taches.forEach(t => {
          const key = t.entreprise_nom || 'Non assigne';
          if (!byEntreprise[key]) byEntreprise[key] = [];
          byEntreprise[key].push(t);
    });
    const chantierMap = {};
    db.chantiers.forEach(c => { chantierMap[c.id] = c.nom; });
    let texte = '';
    Object.entries(byEntreprise).forEach(([entreprise, taches]) => {
          texte += `Objet : Relance travaux - ${entreprise}\n\n`;
          texte += `Bonjour,\n\nJe me permets de vous relancer concernant les points suivants en attente sur nos chantiers :\n\n`;
          taches.forEach(t => {
                  const chantierNom = chantierMap[t.chantier_id] || t.chantier_id;
                  texte += `- [${chantierNom}] ${t.zone} - ${t.description}`;
                  if (t.date_echeance) texte += ` (echeance : ${new Date(t.date_echeance).toLocaleDateString('fr-FR')})`;
                  texte += `\n`;
          });
          texte += `\nMerci de bien vouloir me communiquer un planning de realisation ou de me confirmer la date d'intervention.\n\nCordialement,\nYoussef JALLOULI\nConducteur de Travaux - Challancin\n\n---\n\n`;
    });
    return texte.trim();
}
