import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../components/Layout';
import { KpiCard, Badge, formatEuro } from '../components/ui';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1TqGkvtPpPdapCnsuPzJdOsd9vuYv-520670JvYCGebs/edit?usp=sharing';

const STATUT_COLORS = {
  'BC émis':       { bg: '#DCFCE7', text: '#15803D' },
  'DA validée':    { bg: '#DBEAFE', text: '#1D4ED8' },
  'Devis reçu':    { bg: '#FEF3C7', text: '#B45309' },
  'Visite à faire':{ bg: '#F1F5F9', text: '#475569' },
  'Terminé':       { bg: '#DCFCE7', text: '#15803D' },
  'Annulé':        { bg: '#FEE2E2', text: '#B91C1C' },
};

function StatutBudget({ statut }) {
  const c = STATUT_COLORS[statut] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>
      {statut || '—'}
    </span>
  );
}

export default function Budget() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [filterSite, setFilterSite] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/budget');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--gray-400)', gap: '12px' }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Chargement du Google Sheet…
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '24px', margin: '20px 0' }}>
        <div style={{ fontWeight: 700, color: '#B91C1C', marginBottom: '8px' }}>Impossible de charger le Google Sheet</div>
        <div style={{ fontSize: '13px', color: '#DC2626' }}>{error}</div>
        <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '8px' }}>Vérifiez que le sheet est partagé en "Tout le monde peut voir".</div>
        <button onClick={load} style={{ marginTop: '12px', padding: '8px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Réessayer</button>
      </div>
    </Layout>
  );

  const parChantier = (data?.par_chantier || []).filter(c => {
    if (filterSite && c.site !== filterSite) return false;
    return true;
  });

  const lignesFiltrees = (data?.lignes || []).filter(l => {
    if (filterStatut && l.statut !== filterStatut) return false;
    return true;
  });

  const sites = [...new Set((data?.par_chantier || []).map(c => c.site).filter(Boolean))];
  const statuts = [...new Set((data?.lignes || []).map(l => l.statut).filter(Boolean))];

  return (
    <Layout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gray-600)', fontSize: '13px' }}>
            <ArrowLeft size={14} /> Retour
          </button>
          <div>
            <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '28px', color: 'var(--gray-900)' }}>Suivi financier</h1>
            <div style={{ fontSize: '13px', color: 'var(--gray-400)' }}>{data?.nb_lignes || 0} lignes — Google Sheet synchronisé</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid var(--gray-200)', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: 'var(--gray-600)' }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <a href={SHEET_URL} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: 'none', borderRadius: '8px', background: '#0F9D58', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            <ExternalLink size={14} /> Ouvrir le Sheet
          </a>
        </div>
      </div>

      {/* KPIs globaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard label="Total HT" value={formatEuro(data?.total_ht)} color="var(--blue)" />
        <KpiCard label="Total TTC" value={formatEuro(data?.total_ttc)} color="var(--blue)" />
        <KpiCard label="Chantiers" value={data?.par_chantier?.length || 0} sub={`${sites.join(', ')}`} />
        <KpiCard label="Lignes budget" value={data?.nb_lignes || 0} sub={`${data?.lignes?.filter(l => l.statut === 'BC émis').length || 0} BC émis`} />
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--gray-500)', marginRight: '4px' }}>Filtrer :</span>
        {['', ...sites].map(s => (
          <button key={s || 'all'} onClick={() => setFilterSite(s)}
            style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: filterSite === s ? 600 : 400, border: filterSite === s ? '1.5px solid var(--blue)' : '1px solid var(--gray-200)', background: filterSite === s ? 'var(--blue-light)' : '#fff', color: filterSite === s ? 'var(--blue)' : 'var(--gray-700)', cursor: 'pointer' }}>
            {s || 'Tous les sites'}
          </button>
        ))}
      </div>

      {/* Par chantier — accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px' }}>Par chantier</div>
        {parChantier.map(ch => {
          const isOpen = expanded === ch.chantier;
          const totalHt = ch.total_ht;
          const totalTtc = ch.total_ttc;

          return (
            <div key={ch.chantier} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
              <div onClick={() => setExpanded(isOpen ? null : ch.chantier)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--gray-900)' }}>{ch.chantier}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>{ch.site} — {ch.lignes.length} ligne{ch.lignes.length > 1 ? 's' : ''}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--gray-900)' }}>{formatEuro(totalTtc)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>HT {formatEuro(totalHt)}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {ch.nb_bc > 0 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>{ch.nb_bc} BC</span>}
                  {isOpen ? <ChevronUp size={16} color="var(--gray-400)" /> : <ChevronDown size={16} color="var(--gray-400)" />}
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--gray-100)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)' }}>
                        {['Corps d\'état', 'Entreprise', 'Description', 'N° Devis', 'HT (€)', 'TTC (€)', 'N° DA', 'N° BC', 'Statut', 'Date début', 'Date fin'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ch.lignes.map((l, i) => (
                        <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 === 0 ? '#fff' : 'var(--gray-50)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--gray-700)', fontWeight: 500 }}>{l.corps_etat || '—'}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--blue)', fontWeight: 600 }}>{l.entreprise || '—'}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--gray-600)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.description}>{l.description || '—'}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--gray-500)', fontSize: '11px' }}>{l.n_devis || '—'}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--gray-900)', whiteSpace: 'nowrap' }}>{l.montant_ht ? formatEuro(l.montant_ht) : '—'}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap' }}>{l.montant_ttc ? formatEuro(l.montant_ttc) : '—'}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--gray-500)', fontSize: '11px' }}>{l.n_da || '—'}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--gray-500)', fontSize: '11px' }}>{l.n_bc || '—'}</td>
                          <td style={{ padding: '8px 12px' }}><StatutBudget statut={l.statut} /></td>
                          <td style={{ padding: '8px 12px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{l.date_debut || '—'}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{l.date_fin || '—'}</td>
                        </tr>
                      ))}
                      {/* Total ligne */}
                      <tr style={{ background: 'var(--blue-light)', borderTop: '2px solid var(--blue)' }}>
                        <td colSpan={4} style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--blue)', fontSize: '12px' }}>TOTAL {ch.chantier}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap' }}>{formatEuro(totalHt)}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap' }}>{formatEuro(totalTtc)}</td>
                        <td colSpan={5} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table complète */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Toutes les lignes</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['', ...statuts].map(s => (
              <button key={s || 'all'} onClick={() => setFilterStatut(s)}
                style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: filterStatut === s ? 600 : 400, border: filterStatut === s ? '1.5px solid var(--blue)' : '1px solid var(--gray-200)', background: filterStatut === s ? 'var(--blue-light)' : '#fff', color: filterStatut === s ? 'var(--blue)' : 'var(--gray-600)', cursor: 'pointer' }}>
                {s || 'Tous statuts'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', position: 'sticky', top: 0 }}>
                {['Site', 'Chantier', 'Corps d\'état', 'Entreprise', 'Description', 'N° Devis', 'HT (€)', 'TTC (€)', 'N° DA', 'N° BC', 'Statut', 'Date début', 'Date fin'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignesFiltrees.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 === 0 ? '#fff' : 'var(--gray-50)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--gray-500)', fontSize: '11px', whiteSpace: 'nowrap' }}>{l.site}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--gray-800)', whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.chantier}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{l.corps_etat || '—'}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--blue)', fontWeight: 600, whiteSpace: 'nowrap' }}>{l.entreprise || '—'}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--gray-600)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.description}>{l.description || '—'}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--gray-400)', fontSize: '11px' }}>{l.n_devis || '—'}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--gray-800)', whiteSpace: 'nowrap' }}>{l.montant_ht ? formatEuro(l.montant_ht) : '—'}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap' }}>{l.montant_ttc ? formatEuro(l.montant_ttc) : '—'}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--gray-400)', fontSize: '11px' }}>{l.n_da || '—'}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--gray-400)', fontSize: '11px' }}>{l.n_bc || '—'}</td>
                  <td style={{ padding: '8px 12px' }}><StatutBudget statut={l.statut} /></td>
                  <td style={{ padding: '8px 12px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{l.date_debut || '—'}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{l.date_fin || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
