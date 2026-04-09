const SHEET_ID = '1TqGkvtPpPdapCnsuPzJdOsd9vuYv-520670JvYCGebs';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || '').trim();
    });
    return row;
  }).filter(row => row['Chantier'] && row['Chantier'].trim());
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
}

function normalizeSite(site) {
  if (!site) return '';
  const s = site.toUpperCase();
  if (s.includes('VGR') || s.includes('VAUGIRARD')) return 'Hôpital Vaugirard';
  if (s.includes('HEGP')) return 'HEGP';
  return site;
}

function normalizeStatut(statut) {
  if (!statut) return '';
  const s = statut.toLowerCase();
  if (s.includes('bc émis') || s.includes('bc emis')) return 'BC émis';
  if (s.includes('da valid')) return 'DA validée';
  if (s.includes('devis reçu') || s.includes('devis recu')) return 'Devis reçu';
  if (s.includes('visite')) return 'Visite à faire';
  if (s.includes('terminé') || s.includes('termine')) return 'Terminé';
  if (s.includes('annul')) return 'Annulé';
  return statut;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const response = await fetch(CSV_URL, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Sheet fetch failed: ${response.status}` });
    }

    const text = await response.text();
    const rows = parseCSV(text);

    const lignes = rows.map((r, i) => ({
      id: `budget-${i}`,
      site: normalizeSite(r['Site'] || ''),
      chantier: r['Chantier'] || '',
      type: r['Type'] || '',
      corps_etat: r["Corps d'état"] || r['Corps d\'état'] || r['Corps detat'] || '',
      entreprise: r['Entreprise'] || '',
      description: r['Description'] || '',
      n_devis: r['N° Devis'] || '',
      montant_ht: parseAmount(r['Montant HT (€)'] || r['Montant HT'] || ''),
      montant_ttc: parseAmount(r['Montant TTC (€)'] || r['Montant TTC'] || ''),
      n_da: r['N° DA'] || '',
      n_bc: r['N° BC'] || '',
      statut: normalizeStatut(r['Statut'] || ''),
      date_debut: r['Date début prévue'] || r['Date debut prevue'] || '',
      date_fin: r['Date fin prévue'] || r['Date fin prevue'] || '',
      observations: r['Observations'] || '',
    }));

    // Agrégats par chantier
    const parChantier = {};
    lignes.forEach(l => {
      const key = l.chantier;
      if (!parChantier[key]) {
        parChantier[key] = {
          chantier: l.chantier,
          site: l.site,
          total_ht: 0,
          total_ttc: 0,
          lignes: [],
          nb_bc: 0,
          nb_devis: 0,
        };
      }
      parChantier[key].total_ht += l.montant_ht;
      parChantier[key].total_ttc += l.montant_ttc;
      parChantier[key].lignes.push(l);
      if (l.statut === 'BC émis') parChantier[key].nb_bc++;
      if (l.montant_ht > 0) parChantier[key].nb_devis++;
    });

    // Stats globales
    const total_ht = lignes.reduce((s, l) => s + l.montant_ht, 0);
    const total_ttc = lignes.reduce((s, l) => s + l.montant_ttc, 0);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({
      lignes,
      par_chantier: Object.values(parChantier),
      total_ht,
      total_ttc,
      nb_lignes: lignes.length,
    });
  } catch (err) {
    console.error('Budget API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
