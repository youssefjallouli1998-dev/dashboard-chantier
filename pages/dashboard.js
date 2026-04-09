import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, X, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import { StatutBadge, ProgressBar, KpiCard, Modal, FormField, inputStyle, selectStyle, Btn, SectionTitle, formatEuro } from '../components/ui';

const SITES = ['HEGP', 'Hôpital Vaugirard'];
const STATUTS = ['En cours', 'En attente', 'Bloqué', 'Terminé'];

function getAvancement(chantier) {
  const zones = chantier.zones || [];
  if (!zones.length) return 0;
  return Math.round(zones.reduce((s, z) => s + (z.avancement || 0), 0) / zones.length);
}

export default function Dashboard() {
  const router = useRouter();
  const [chantiers, setChantiers] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [stats, setStats] = useState({});
  const [alertes, setAlertes] = useState({ retards: [], bloques: [], chantiers_bloques: [] });
  const [filterSite, setFilterSite] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nom: '', site: 'HEGP', statut: 'En attente', description: '',
    budget_ht: '', budget_ttc: '', date_debut: '', date_fin_prevue: '',
    responsable: '', intervenants: [], zones: [{ nom: '' }],
  });
  const [saving, setSaving] = useState(false);
  const [budgetSheet, setBudgetSheet] = useState(null);

  useEffect(() => {
    loadAll();
    fetch('/api/budget').then(r => r.ok ? r.json() : null).then(d => { if (d) setBudgetSheet(d); }).catch(() => {});
  }, []);

  async function loadAll() {
    const [ch, ent, st, al] = await Promise.all([
      fetch('/api/chantiers').then(r => r.json()),
      fetch('/api/entreprises').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/alertes').then(r => r.json()),
    ]);
    setChantiers(ch);
    setEntreprises(ent);
    setStats(st);
    setAlertes(al);
  }

  async function deleteChantier(id, e) {
    e.stopPropagation();
    if (!confirm('Supprimer ce chantier ?')) return;
    await fetch(`/api/chantiers/${id}`, { method: 'DELETE' });
    loadAll();
  }

  function handleBudgetHT(val) {
    const ht = parseFloat(val) || 0;
    setForm(f => ({ ...f, budget_ht: val, budget_ttc: ht ? (ht * 1.2).toFixed(2) : '' }));
  }

  function toggleIntervenant(nom) {
    setForm(f => ({
      ...f,
      intervenants: f.intervenants.includes(nom)
        ? f.intervenants.filter(i => i !== nom)
        : [...f.intervenants, nom],
    }));
  }

  function addZone() {
    setForm(f => ({ ...f, zones: [...f.zones, { nom: '' }] }));
  }

  function removeZone(i) {
    setForm(f => ({ ...f, zones: f.zones.filter((_, idx) => idx !== i) }));
  }

  function updateZone(i, val) {
    setForm(f => {
      const z = [...f.zones];
      z[i] = { nom: val };
      return { ...f, zones: z };
    });
  }

  async function saveChantier(e) {
    e.preventDefault();
    if (!form.nom.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      budget_ht: parseFloat(form.budget_ht) || 0,
      budget_ttc: parseFloat(form.budget_ttc) || 0,
      zones: form.zones.filter(z => z.nom.trim()).map(z => ({ nom: z.nom, avancement: 0 })),
    };
    await fetch('/api/chantiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ nom: '', site: 'HEGP', statut: 'En attente', description: '', budget_ht: '', budget_ttc: '', date_debut: '', date_fin_prevue: '', responsable: '', intervenants: [], zones: [{ nom: '' }] });
    loadAll();
  }

  const filtered = chantiers.filter(c => {
    if (filterSite && c.site !== filterSite) return false;
    if (filterStatut && c.statut !== filterStatut) return false;
    return true;
  });

  const alertCount = (alertes.retards?.length || 0) + (alertes.bloques?.length || 0) + (alertes.chantiers_bloques?.length || 0);

  return (
    <Layout>
      <style>{`
        .chantier-card:hover { box-shadow: 0 4px 16px rgba(0,85,255,0.10); border-color: var(--blue) !important; }
        .del-btn { opacity: 0; transition: opacity 0.15s; }
        .chantier-card:hover .del-btn { opacity: 1; }
        .add-card:hover { border-color: var(--blue) !important; background: var(--blue-light) !important; }
        .filter-btn:hover { background: var(--gray-100) !important; }
      `}</style>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '28px', color: 'var(--gray-900)' }}>Tableau de bord</h1>
          <div style={{ fontSize: '13px', color: 'var(--gray-400)' }}>{chantiers.length} chantiers — HEGP & Hôpital Vaugirard</div>
        </div>
        <Btn onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nouveau chantier
        </Btn>
      </div>

      {/* Alert banner */}
      {alertCount > 0 && (
        <div
          onClick={() => router.push('/relances')}
          style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px',
            padding: '12px 16px', marginBottom: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'background 0.15s',
          }}
        >
          <AlertTriangle size={18} color="#EF4444" />
          <span style={{ fontWeight: 600, color: '#B91C1C', fontSize: '14px' }}>
            {alertCount} alerte{alertCount > 1 ? 's' : ''} — {alertes.retards?.length || 0} retard{(alertes.retards?.length || 0) > 1 ? 's' : ''}, {alertes.bloques?.length || 0} bloqué{(alertes.bloques?.length || 0) > 1 ? 's' : ''}
          </span>
          <span style={{ marginLeft: 'auto', color: '#EF4444', fontSize: '12px', fontWeight: 500 }}>Voir les relances →</span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard label="Chantiers" value={stats.total_chantiers || 0} sub={`${stats.en_cours || 0} en cours`} color="var(--blue)" />
        <KpiCard
          label="Budget total TTC"
          value={budgetSheet ? formatEuro(budgetSheet.total_ttc) : '—'}
          sub={budgetSheet ? `HT ${formatEuro(budgetSheet.total_ht)} · ${budgetSheet.nb_lignes} lignes` : 'Chargement…'}
          color="var(--blue)"
        />
        <KpiCard label="Alertes" value={alertCount} sub={`${stats.retards || 0} en retard`} color={alertCount > 0 ? 'var(--red)' : 'var(--green)'} />
        <KpiCard label="Chantiers Notion" value={stats.total_chantiers || 0} sub={`${stats.en_cours || 0} en cours · ${stats.termines || 0} terminés`} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: 'var(--gray-500)', alignSelf: 'center', marginRight: '4px' }}>Filtrer :</span>
        {['', ...SITES].map(s => (
          <button
            key={s || 'all-sites'}
            className="filter-btn"
            onClick={() => setFilterSite(s)}
            style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: filterSite === s ? 600 : 400,
              border: filterSite === s ? '1.5px solid var(--blue)' : '1px solid var(--gray-200)',
              background: filterSite === s ? 'var(--blue-light)' : '#fff',
              color: filterSite === s ? 'var(--blue)' : 'var(--gray-700)',
              cursor: 'pointer',
            }}
          >{s || 'Tous les sites'}</button>
        ))}
        <div style={{ width: '1px', background: 'var(--gray-200)', margin: '0 4px' }} />
        {['', ...STATUTS].map(s => (
          <button
            key={s || 'all-statuts'}
            className="filter-btn"
            onClick={() => setFilterStatut(s)}
            style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: filterStatut === s ? 600 : 400,
              border: filterStatut === s ? '1.5px solid var(--blue)' : '1px solid var(--gray-200)',
              background: filterStatut === s ? 'var(--blue-light)' : '#fff',
              color: filterStatut === s ? 'var(--blue)' : 'var(--gray-700)',
              cursor: 'pointer',
            }}
          >{s || 'Tous statuts'}</button>
        ))}
      </div>

      {/* Grille chantiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {filtered.map(c => {
          const av = getAvancement(c);
          return (
            <div
              key={c.id}
              className="chantier-card"
              onClick={() => router.push(`/chantier/${c.id}`)}
              style={{
                background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '12px',
                padding: '16px', cursor: 'pointer', position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              <button
                className="del-btn"
                onClick={e => deleteChantier(c.id, e)}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'var(--gray-100)', border: 'none', borderRadius: '6px',
                  width: '24px', height: '24px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: 'var(--gray-400)',
                }}
              >
                <X size={13} />
              </button>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', paddingRight: '28px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--gray-900)', marginBottom: '4px', lineHeight: 1.3 }}>{c.nom}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{c.site}</div>
                </div>
                <StatutBadge statut={c.statut} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gray-500)', marginBottom: '5px' }}>
                  <span>Avancement</span>
                  <span style={{ fontWeight: 600 }}>{av}%</span>
                </div>
                <ProgressBar value={av} size="sm" />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                {(c.zones || []).slice(0, 3).map((z, i) => (
                  <span key={i} style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '5px',
                    background: 'var(--gray-100)', color: 'var(--gray-500)',
                  }}>{z.nom}</span>
                ))}
                {(c.zones || []).length > 3 && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'var(--gray-100)', color: 'var(--gray-400)' }}>
                    +{c.zones.length - 3}
                  </span>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '8px', fontSize: '12px', color: 'var(--gray-400)', fontWeight: 500 }}>
                {formatEuro(c.budget_ttc)} TTC
              </div>
            </div>
          );
        })}

        {/* Carte + */}
        <div
          className="add-card"
          onClick={() => setShowModal(true)}
          style={{
            border: '2px dashed var(--gray-300)', borderRadius: '12px', padding: '16px',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            minHeight: '160px', transition: 'all 0.15s',
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={18} color="var(--gray-400)" />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--gray-400)', fontWeight: 500 }}>Nouveau chantier</span>
        </div>
      </div>

      {/* Modal création */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau chantier" width="620px">
        <form onSubmit={saveChantier}>
          <SectionTitle>Informations générales</SectionTitle>
          <FormField label="Nom du chantier" required>
            <input style={inputStyle} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex : Vestiaires Challancin HEGP" required />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Site">
              <select style={selectStyle} value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))}>
                {SITES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Statut">
              <select style={selectStyle} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                {STATUTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Description">
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>

          <SectionTitle>Budget</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Budget HT (€)">
              <input style={inputStyle} type="number" step="0.01" value={form.budget_ht} onChange={e => handleBudgetHT(e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Budget TTC (€) — calculé ×1.2">
              <input style={{ ...inputStyle, background: 'var(--gray-50)' }} type="number" step="0.01" value={form.budget_ttc} onChange={e => setForm(f => ({ ...f, budget_ttc: e.target.value }))} placeholder="0" />
            </FormField>
          </div>

          <SectionTitle>Planning</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Date de début">
              <input style={inputStyle} type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} />
            </FormField>
            <FormField label="Date de fin prévue">
              <input style={inputStyle} type="date" value={form.date_fin_prevue} onChange={e => setForm(f => ({ ...f, date_fin_prevue: e.target.value }))} />
            </FormField>
          </div>

          <SectionTitle>Équipe & Intervenants</SectionTitle>
          <FormField label="Responsable">
            <input style={inputStyle} value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} placeholder="Nom du responsable" />
          </FormField>
          <FormField label="Entreprises intervenantes">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {entreprises.map(ent => {
                const sel = form.intervenants.includes(ent.nom);
                return (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => toggleIntervenant(ent.nom)}
                    style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: sel ? 600 : 400,
                      border: sel ? '1.5px solid var(--blue)' : '1px solid var(--gray-200)',
                      background: sel ? 'var(--blue-light)' : '#fff',
                      color: sel ? 'var(--blue)' : 'var(--gray-600)',
                      cursor: 'pointer',
                    }}
                  >{ent.nom}</button>
                );
              })}
            </div>
          </FormField>

          <SectionTitle>Zones du chantier</SectionTitle>
          {form.zones.map((z, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={z.nom}
                onChange={e => updateZone(i, e.target.value)}
                placeholder={`Zone ${i + 1}`}
              />
              {form.zones.length > 1 && (
                <button type="button" onClick={() => removeZone(i)} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', color: 'var(--gray-400)' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={addZone} type="button">
            <Plus size={13} /> Ajouter une zone
          </Btn>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--gray-100)', paddingTop: '16px' }}>
            <Btn variant="secondary" onClick={() => setShowModal(false)} type="button">Annuler</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Créer le chantier'}</Btn>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
