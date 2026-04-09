import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const CHANTIERS_DB_ID = process.env.NOTION_CHANTIERS_DB_ID;

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title[0]?.plain_text ?? '';
  if (prop.type === 'rich_text') return prop.rich_text[0]?.plain_text ?? '';
  return '';
}

function getSelect(prop) {
  if (!prop || !prop.select) return '';
  // Supprimer les emojis et espaces en tête (ex: "🔵 En cours" → "En cours")
  return (prop.select.name ?? '').replace(/^[\p{Emoji}\s]+/u, '').trim();
}

function getNumber(prop) {
  if (!prop || prop.number === null || prop.number === undefined) return 0;
  return prop.number;
}

function getDate(prop) {
  if (!prop || !prop.date) return '';
  return prop.date.start ?? '';
}

// Normalise les noms de site pour correspondre au dashboard
function normalizeSite(site) {
  if (!site) return '';
  if (site.includes('Vaugirard')) return 'Hôpital Vaugirard';
  if (site.includes('HEGP')) return 'HEGP';
  return site;
}

// Normalise les statuts pour correspondre au dashboard
function normalizeStatut(statut) {
  if (!statut) return 'En attente';
  if (statut.includes('En cours')) return 'En cours';
  if (statut.includes('Terminé') || statut.includes('Termine')) return 'Terminé';
  if (statut.includes('lancer') || statut.includes('attente')) return 'En attente';
  if (statut.includes('Bloqué') || statut.includes('Bloque')) return 'Bloqué';
  return statut;
}

// ─── CHANTIERS ──────────────────────────────────────────────────────────────

export async function getChantiers() {
  const pages = [];
  let cursor = undefined;
  do {
    const resp = await notion.databases.query({
      database_id: CHANTIERS_DB_ID,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);

  return pages.map(pageToChantier);
}

export async function getChantier(id) {
  const page = await notion.pages.retrieve({ page_id: id });
  return pageToChantier(page);
}

export async function createChantier(data) {
  const page = await notion.pages.create({
    parent: { database_id: CHANTIERS_DB_ID },
    properties: chantierToProperties(data),
  });
  return pageToChantier(page);
}

export async function updateChantier(id, data) {
  const page = await notion.pages.update({
    page_id: id,
    properties: chantierToProperties(data),
  });
  return pageToChantier(page);
}

export async function deleteChantier(id) {
  await notion.pages.update({ page_id: id, archived: true });
}

function pageToChantier(page) {
  const p = page.properties;
  const rawSite = getSelect(p['Site']);
  const rawStatut = getSelect(p['État']);
  const chiffrage = getSelect(p['Chiffrage']);

  return {
    id: page.id,
    nom: getText(p['Chantier']),
    site: normalizeSite(rawSite),
    statut: normalizeStatut(rawStatut),
    chiffrage,
    interlocuteur: getText(p['Interlocuteur']),
    localisation: getText(p['Localisation']),
    // Champs non présents dans Notion — valeurs neutres
    budget_ht: 0,
    budget_ttc: 0,
    description: getText(p['Localisation']),
    date_debut: '',
    date_fin_prevue: '',
    responsable: getText(p['Interlocuteur']),
    intervenants: [],
    zones: [],
    notion_page_id: page.id,
  };
}

function chantierToProperties(data) {
  const props = {};
  if (data.nom !== undefined) {
    props['Chantier'] = { title: [{ text: { content: data.nom } }] };
  }
  if (data.site !== undefined) {
    // Re-ajouter le format Notion avec emoji
    const siteMap = {
      'HEGP': '🏥 HEGP',
      'Hôpital Vaugirard': '🏢 Vaugirard',
    };
    props['Site'] = { select: { name: siteMap[data.site] || data.site } };
  }
  if (data.statut !== undefined) {
    const statutMap = {
      'En cours': '🔵 En cours',
      'En attente': '⚪ En attente',
      'Terminé': '🟢 Terminé',
      'Bloqué': '⚪ En attente', // Pas de "Bloqué" dans Notion, on mappe vers En attente
    };
    props['État'] = { select: { name: statutMap[data.statut] || data.statut } };
  }
  if (data.interlocuteur !== undefined || data.responsable !== undefined) {
    props['Interlocuteur'] = { rich_text: [{ text: { content: data.interlocuteur || data.responsable || '' } }] };
  }
  if (data.localisation !== undefined) {
    props['Localisation'] = { rich_text: [{ text: { content: data.localisation || '' } }] };
  }
  if (data.chiffrage !== undefined) {
    const chiffrageMap = {
      'À prévoir': '📋 À prévoir',
      'Visite faite': '🔍 Visite faite',
      'Devis reçu': '📄 Devis reçu',
      'BDC saisi': '✅ BDC saisi',
      'Terminé': '🏁 Terminé',
    };
    props['Chiffrage'] = { select: { name: chiffrageMap[data.chiffrage] || data.chiffrage } };
  }
  return props;
}

// ─── STATS ──────────────────────────────────────────────────────────────────

export async function getStats() {
  const chantiers = await getChantiers();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    // Noms alignés sur ce qu'attend le dashboard
    total_chantiers: chantiers.length,
    en_cours: chantiers.filter(c => c.statut === 'En cours').length,
    en_attente: chantiers.filter(c => c.statut === 'En attente').length,
    termines: chantiers.filter(c => c.statut === 'Terminé').length,
    bloques: chantiers.filter(c => c.statut === 'Bloqué').length,
    budget_total_ht: 0,   // Pas dans Notion
    budget_total_ttc: 0,  // Pas dans Notion
    retards: 0,           // Pas de tâches dans Notion
    taches_total: 0,      // Pas de tâches dans Notion
    avancement_global: 0, // Pas de zones dans Notion
    // Stats par chiffrage
    par_chiffrage: chantiers.reduce((acc, c) => {
      if (c.chiffrage) acc[c.chiffrage] = (acc[c.chiffrage] || 0) + 1;
      return acc;
    }, {}),
  };
}

// ─── ALERTES ────────────────────────────────────────────────────────────────

export async function getAlertes() {
  const chantiers = await getChantiers();

  // Structure attendue par le dashboard : {retards, bloques, chantiers_bloques}
  const chantiers_bloques = chantiers.filter(c => c.statut === 'Bloqué');

  // "À lancer" → on les traite comme des retards potentiels
  const aLancer = chantiers.filter(c => c.statut === 'En attente' && c.chiffrage === 'À prévoir');

  return {
    retards: aLancer.map(c => ({
      id: `alerte-${c.id}`,
      chantier_id: c.id,
      chantier_nom: c.nom,
      zone: '',
      description: `${c.nom} — chiffrage à prévoir`,
      entreprise_nom: '',
      date_echeance: '',
      statut: 'En attente',
    })),
    bloques: [],
    chantiers_bloques,
  };
}
