import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Plus, X, GripVertical, AlertTriangle } from 'lucide-react';
import Layout from '../../components/Layout';
import { Badge, StatutBadge, ProgressBar, KpiCard, Modal, FormField, inputStyle, selectStyle, Btn, SectionTitle, formatEuro, formatDate } from '../../components/ui';

const STATUTS = ['En attente', 'En cours', 'Bloqué', 'Terminé'];
const TYPES_TACHE = ['Dépose', 'Pose', 'Finition', 'Contrôle'];
const STATUTS_TACHE = ['À faire', 'En cours', 'Terminé', 'Bloqué'];

function typeBadgeColor(type) {
  if (type === 'Dépose') return 'yellow';
  if (type === 'Pose') return 'blue';
  if (type === 'Finition') return 'green';
  if (type === 'Contrôle') return 'violet';
  return 'gray';
}

function addJoursOuvres(startDate, jours) {
  const d = new Date(startDate);
  let added = 0;
  while (added < jours) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

function calcGanttDates(taches, dateDebutChantier) {
  if (!dateDebutChantier) return {};
  const byZone = {};
  taches.forEach(t => {
    if (!byZone[t.zone]) byZone[t.zone] = [];
    byZone[t.zone].push(t);
  });

  const result = {};
  Object.entries(byZone).forEach(([zone, zTaches]) => {
    const sorted = [...zTaches].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    let cursor = new Date(dateDebutChantier);
    sorted.forEach(t => {
      const debut = new Date(cursor);
      const fin = addJoursOuvres(cursor, t.duree_jours || 1);
      result[t.id] = { debut, fin };
      cursor = new Date(fin);
    });
  });
  return result;
}

function getAvancement(chantier) {
  const zones = chantier.zones || [];
  if (!zones.length) return 0;
  return Math.round(zones.reduce((s, z) => s + (z.avancement || 0), 0) / zones.length);
}

export default function ChantierDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [chantier, setChantier] = useState(null);
  const [entreprises, setEntreprises] = useState([]);
  const [taches, setTaches] = useState([]);
  const [devis, setDevis] = useState([]);
  const [onglet, setOnglet] = useState('zones');
  const [showTacheModal, setShowTacheModal] = useState(false);
  const [showDevisModal, setShowDevisModal] = useState(false);
  const [tacheForm, setTacheForm] = useState({
    zone: '', type_tache: 'Pose', description: '', statut: 'À faire',
    entreprise_id: '', entreprise_nom: '', date_echeance: '', duree_jours: 1,
  });
  const [devisForm, setDevisForm] = useState({
    entreprise_id: '', entreprise_nom: '', montant_ht: '', montant_ttc: '',
    description: '', date_reception: '', statut: 'En attente', n_devis: '',
  });
  const [saving, setSaving] = useState(false);
  const [editDuree, setEditDuree] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const dragItem = useRef(null);
  const dragTarget = useRef(null);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  async function loadAll() {
    const [ch, ent, ta, dv] = await Promise.all([
      fetch(`/api/chantiers/${id}`).then(r => r.json()),
      fetch('/api/entreprises').then(r => r.json()),
      fetch(`/api/taches?chantier_id=${id}`).then(r => r.json()),
      fetch(`/api/devis?chantier_id=${id}`).then(r => r.json()),
    ]);
    setChantier(ch);
    setEntreprises(ent);
    setTaches(ta);
    setDevis(dv);
  }

  async function updateStatut(statut) {
    await fetch(`/api/chantiers/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    setChantier(c => ({ ...c, statut }));
  }

  async function saveTache(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/taches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tacheForm, chantier_id: id }),
    });
    setSaving(false);
    setShowTacheModal(false);
    setTacheForm({ zone: '', type_tache: 'Pose', description: '', statut: 'À faire', entreprise_id: '', entreprise_nom: '', date_echeance: '', duree_jours: 1 });
    loadAll();
  }

  async function deleteTache(tid) {
    if (!confirm('Supprimer cette tâche ?')) return;
    await fetch(`/api/taches?id=${tid}`, { method: 'DELETE' });
    loadAll();
  }

  async function updateTacheStatut(tid, statut) {
    await fetch(`/api/taches?id=${tid}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    loadAll();
  }

  async function saveDuree(tid, val) {
    await fetch(`/api/taches?id=${tid}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duree_jours: parseInt(val) }),
    });
    setEditDuree(null);
    loadAll();
  }

  async function saveDevis(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/devis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...devisForm, chantier_id: id }),
    });
    setSaving(false);
    setShowDevisModal(false);
    setDevisForm({ entreprise_id: '', entreprise_nom: '', montant_ht: '', montant_ttc: '', description: '', date_reception: '', statut: 'En attente', n_devis: '' });
    loadAll();
  }

  function handleDragStart(tache) {
    dragItem.current = tache;
  }

  function handleDragEnter(tache) {
    dragTarget.current = tache;
    setDragOver(tache.id);
  }

  async function handleDrop(zone) {
    if (!dragItem.current || !dragTarget.current) return;
    if (dragItem.current.id === dragTarget.current.id) return;
    const zoneTaches = taches.filter(t => t.zone === zone).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    const fromIdx = zoneTaches.findIndex(t => t.id === dragItem.current.id);
    const toIdx = zoneTaches.findIndex(t => t.id === dragTarget.current.id);
    const reordered = [...zoneTaches];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const ordered_ids = reordered.map(t => t.id);
    setDragOver(null);
    dragItem.current = null;
    dragTarget.current = null;
    await fetch(`/api/taches?action=reorder&chantier_id=${id}&zone=${encodeURIComponent(zone)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordered_ids }),
    });
    loadAll();
  }

  function setEntrepriseInForm(setF, ent_id) {
    const ent = entreprises.find(e => e.id === ent_id);
    setF(f => ({ ...f, entreprise_id: ent_id, entreprise_nom: ent ? ent.nom : '' }));
  }

  if (!chantier) return <Layout><div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>Chargement…</div></Layout>;

  const av = getAvancement(chantier);
  const zones = [...new Set(taches.map(t => t.zone))];
  const ganttDates = calcGanttDates(taches, chantier.date_debut);

  // Intervenants chantier en premier dans le select
  const intervenantsFirst = [
    ...entreprises.filter(e => (chantier.intervenants || []).includes(e.nom)),
    ...entreprises.filter(e => !(chantier.intervenants || []).includes(e.nom)),
  ];

  const zonesOptions = (chantier.zones || []).map(z => z.nom);

  return (
    <Layout>
      <style>{`
        .tache-row:hover { background: var(--gray-50) !important; }
        .tache-row.drag-over { border-top: 2px solid var(--blue) !important; }
      `}</style>

      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gray-600)', fontSize: '13px' }}>
          <ArrowLeft size={14} /> Retour
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '24px', color: 'var(--gray-900)', lineHeight: 1 }}>{chantier.nom}</h1>
          <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>{chantier.site}</div>
        </div>
        <select
          value={chantier.statut}
          onChange={e => updateStatut(e.target.value)}
          style={{ ...selectStyle, width: 'auto', fontWeight: 600 }}
        >
          {STATUTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Intervenants badges */}
      {(chantier.intervenants || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {chantier.intervenants.map(nom => (
            <Badge key={nom} color="blue">{nom}</Badge>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <KpiCard label="Avancement" value={`${av}%`} color={av >= 80 ? 'var(--green)' : av >= 40 ? 'var(--blue)' : 'var(--amber)'} />
        <KpiCard label="Budget TTC" value={formatEuro(chantier.budget_ttc)} sub={`HT : ${formatEuro(chantier.budget_ht)}`} />
        <KpiCard label="Fin prévue" value={formatDate(chantier.date_fin_prevue)} sub={`Début : ${formatDate(chantier.date_debut)}`} />
        <KpiCard label="Tâches" value={taches.length} sub={`${taches.filter(t => t.statut === 'Terminé').length} terminées`} />
      </div>

      {/* Description */}
      {chantier.description && (
        <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', color: 'var(--gray-600)' }}>
          {chantier.description}
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--gray-200)', marginBottom: '20px' }}>
        {[
          { key: 'zones', label: 'Zones' },
          { key: 'taches', label: 'Tâches' },
          { key: 'planning', label: 'Planning' },
          { key: 'devis', label: 'Devis' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setOnglet(key)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: onglet === key ? 600 : 400, fontSize: '14px',
              color: onglet === key ? 'var(--blue)' : 'var(--gray-500)',
              borderBottom: onglet === key ? '2px solid var(--blue)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* ZONES */}
      {onglet === 'zones' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {(chantier.zones || []).map((z, i) => {
            const color = z.avancement >= 80 ? '#22C55E' : z.avancement >= 40 ? '#0055FF' : '#F59E0B';
            return (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{z.nom}</span>
                  <span style={{ fontWeight: 700, color, fontSize: '16px', fontFamily: 'Barlow Condensed, sans-serif' }}>{z.avancement || 0}%</span>
                </div>
                <ProgressBar value={z.avancement || 0} />
              </div>
            );
          })}
        </div>
      )}

      {/* TÂCHES */}
      {onglet === 'taches' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Btn onClick={() => setShowTacheModal(true)}><Plus size={14} /> Nouvelle tâche</Btn>
          </div>

          {zones.map(zone => {
            const zoneTaches = taches.filter(t => t.zone === zone).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
            return (
              <div key={zone} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', padding: '0 4px', borderLeft: '3px solid var(--blue)', paddingLeft: '10px' }}>
                  {zone}
                </div>
                {zoneTaches.map(t => (
                  <div
                    key={t.id}
                    className={`tache-row${dragOver === t.id ? ' drag-over' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(t)}
                    onDragEnter={() => handleDragEnter(t)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(zone)}
                    onDragEnd={() => setDragOver(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#fff', border: '1px solid var(--gray-200)',
                      borderRadius: '8px', padding: '10px 12px', marginBottom: '6px',
                      cursor: 'grab', transition: 'background 0.1s',
                    }}
                  >
                    <GripVertical size={14} color="var(--gray-300)" style={{ flexShrink: 0 }} />
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', flexShrink: 0 }}>
                      {t.ordre}
                    </span>
                    <Badge color={typeBadgeColor(t.type_tache)}>{t.type_tache}</Badge>
                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--gray-700)', fontWeight: 500 }}>{t.description}</span>
                    {t.entreprise_nom && (
                      <span style={{ fontSize: '11px', color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '5px' }}>{t.entreprise_nom}</span>
                    )}
                    {/* Durée cliquable */}
                    {editDuree === t.id ? (
                      <input
                        autoFocus
                        type="number"
                        defaultValue={t.duree_jours}
                        onBlur={e => saveDuree(t.id, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveDuree(t.id, e.target.value); if (e.key === 'Escape') setEditDuree(null); }}
                        style={{ width: '48px', padding: '2px 6px', border: '1px solid var(--blue)', borderRadius: '5px', fontSize: '12px', textAlign: 'center' }}
                      />
                    ) : (
                      <button onClick={() => setEditDuree(t.id)} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', cursor: 'pointer', color: 'var(--gray-500)', fontWeight: 600 }}>
                        {t.duree_jours}j
                      </button>
                    )}
                    <select
                      value={t.statut}
                      onChange={e => updateTacheStatut(t.id, e.target.value)}
                      style={{ ...selectStyle, width: 'auto', fontSize: '12px', padding: '4px 28px 4px 8px' }}
                    >
                      {STATUTS_TACHE.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => deleteTache(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-300)', padding: '2px', display: 'flex' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}

          {taches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)', fontSize: '14px' }}>
              Aucune tâche — cliquez sur "+ Nouvelle tâche" pour commencer
            </div>
          )}
        </div>
      )}

      {/* PLANNING */}
      {onglet === 'planning' && (
        <div>
          {!chantier.date_debut ? (
            <div style={{ background: 'var(--amber-light)', border: '1px solid #FCD34D', borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={18} color="var(--amber)" />
              <span style={{ fontSize: '14px', color: '#92400E' }}>Aucune date de début définie pour ce chantier — le planning ne peut pas être calculé.</span>
            </div>
          ) : taches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>Aucune tâche à planifier.</div>
          ) : (
            <GanttView taches={taches} ganttDates={ganttDates} />
          )}
        </div>
      )}

      {/* DEVIS */}
      {onglet === 'devis' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Btn onClick={() => setShowDevisModal(true)}><Plus size={14} /> Nouveau devis</Btn>
          </div>
          {devis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>Aucun devis enregistré.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {devis.map(d => (
                <div key={d.id} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{d.entreprise_nom}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{d.description}</div>
                  </div>
                  {d.n_devis && <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'monospace', background: 'var(--gray-50)', padding: '3px 8px', borderRadius: '5px' }}>{d.n_devis}</span>}
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{formatDate(d.date_reception)}</span>
                  <Badge color={d.statut === 'Accepté' ? 'green' : d.statut === 'Refusé' ? 'red' : 'gray'}>{d.statut}</Badge>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', fontFamily: 'Barlow Condensed, sans-serif' }}>{formatEuro(d.montant_ttc)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>HT {formatEuro(d.montant_ht)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal tâche */}
      <Modal open={showTacheModal} onClose={() => setShowTacheModal(false)} title="Nouvelle tâche">
        <form onSubmit={saveTache}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Zone" required>
              <select style={selectStyle} value={tacheForm.zone} onChange={e => setTacheForm(f => ({ ...f, zone: e.target.value }))} required>
                <option value="">— Choisir —</option>
                {zonesOptions.map(z => <option key={z}>{z}</option>)}
              </select>
            </FormField>
            <FormField label="Type">
              <select style={selectStyle} value={tacheForm.type_tache} onChange={e => setTacheForm(f => ({ ...f, type_tache: e.target.value }))}>
                {TYPES_TACHE.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Description" required>
            <input style={inputStyle} value={tacheForm.description} onChange={e => setTacheForm(f => ({ ...f, description: e.target.value }))} placeholder="Description de la tâche" required />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Durée (jours ouvrés)">
              <input style={inputStyle} type="number" min="1" value={tacheForm.duree_jours} onChange={e => setTacheForm(f => ({ ...f, duree_jours: parseInt(e.target.value) || 1 }))} />
            </FormField>
            <FormField label="Date d'échéance">
              <input style={inputStyle} type="date" value={tacheForm.date_echeance} onChange={e => setTacheForm(f => ({ ...f, date_echeance: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Entreprise">
            <select style={selectStyle} value={tacheForm.entreprise_id} onChange={e => setEntrepriseInForm(setTacheForm, e.target.value)}>
              <option value="">— Non assigné —</option>
              {intervenantsFirst.map(ent => <option key={ent.id} value={ent.id}>{ent.nom}{(chantier.intervenants || []).includes(ent.nom) ? ' ★' : ''}</option>)}
            </select>
          </FormField>
          <FormField label="Statut">
            <select style={selectStyle} value={tacheForm.statut} onChange={e => setTacheForm(f => ({ ...f, statut: e.target.value }))}>
              {STATUTS_TACHE.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--gray-100)', paddingTop: '16px' }}>
            <Btn variant="secondary" onClick={() => setShowTacheModal(false)} type="button">Annuler</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Créer la tâche'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Modal devis */}
      <Modal open={showDevisModal} onClose={() => setShowDevisModal(false)} title="Nouveau devis">
        <form onSubmit={saveDevis}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Entreprise">
              <select style={selectStyle} value={devisForm.entreprise_id} onChange={e => setEntrepriseInForm(setDevisForm, e.target.value)}>
                <option value="">— Choisir —</option>
                {entreprises.map(ent => <option key={ent.id} value={ent.id}>{ent.nom}</option>)}
              </select>
            </FormField>
            <FormField label="N° Devis">
              <input style={inputStyle} value={devisForm.n_devis} onChange={e => setDevisForm(f => ({ ...f, n_devis: e.target.value }))} placeholder="Ex: 225-1271-D" />
            </FormField>
          </div>
          <FormField label="Description">
            <input style={inputStyle} value={devisForm.description} onChange={e => setDevisForm(f => ({ ...f, description: e.target.value }))} placeholder="Description du devis" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Montant HT (€)">
              <input style={inputStyle} type="number" step="0.01" value={devisForm.montant_ht} onChange={e => {
                const ht = parseFloat(e.target.value) || 0;
                setDevisForm(f => ({ ...f, montant_ht: e.target.value, montant_ttc: ht ? (ht * 1.2).toFixed(2) : '' }));
              }} />
            </FormField>
            <FormField label="Montant TTC (€)">
              <input style={{ ...inputStyle, background: 'var(--gray-50)' }} type="number" step="0.01" value={devisForm.montant_ttc} onChange={e => setDevisForm(f => ({ ...f, montant_ttc: e.target.value }))} />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Date de réception">
              <input style={inputStyle} type="date" value={devisForm.date_reception} onChange={e => setDevisForm(f => ({ ...f, date_reception: e.target.value }))} />
            </FormField>
            <FormField label="Statut">
              <select style={selectStyle} value={devisForm.statut} onChange={e => setDevisForm(f => ({ ...f, statut: e.target.value }))}>
                {['En attente', 'Accepté', 'Refusé'].map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--gray-100)', paddingTop: '16px' }}>
            <Btn variant="secondary" onClick={() => setShowDevisModal(false)} type="button">Annuler</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer le devis'}</Btn>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

function GanttView({ taches, ganttDates }) {
  const allDates = Object.values(ganttDates);
  if (!allDates.length) return null;

  const minDate = new Date(Math.min(...allDates.map(d => d.debut)));
  const maxDate = new Date(Math.max(...allDates.map(d => d.fin)));
  const totalMs = maxDate - minDate || 1;

  const milestones = [0, 25, 50, 75, 100].map(pct => {
    const d = new Date(minDate.getTime() + (totalMs * pct) / 100);
    return { pct, label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) };
  });

  const statusColor = { 'Terminé': '#22C55E', 'En cours': '#0055FF', 'Bloqué': '#EF4444', 'À faire': '#CBD5E1' };

  const sorted = [...taches].sort((a, b) => {
    if (a.zone < b.zone) return -1;
    if (a.zone > b.zone) return 1;
    return (a.ordre || 0) - (b.ordre || 0);
  });

  return (
    <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header dates */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
        <div style={{ width: '200px', flexShrink: 0, padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tâche</div>
        <div style={{ flex: 1, position: 'relative', height: '36px' }}>
          {milestones.map(m => (
            <div key={m.pct} style={{ position: 'absolute', left: `${m.pct}%`, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)', paddingTop: '8px', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      {sorted.map(t => {
        const d = ganttDates[t.id];
        if (!d) return null;
        const left = ((d.debut - minDate) / totalMs) * 100;
        const width = Math.max(0.5, ((d.fin - d.debut) / totalMs) * 100);
        const color = statusColor[t.statut] || '#CBD5E1';

        return (
          <div key={t.id} style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)', alignItems: 'center', minHeight: '38px' }}>
            <div style={{ width: '200px', flexShrink: 0, padding: '6px 16px', fontSize: '12px', color: 'var(--gray-700)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.description}>
              {t.description}
            </div>
            <div style={{ flex: 1, position: 'relative', height: '38px' }}>
              {/* Grid lines */}
              {milestones.map(m => (
                <div key={m.pct} style={{ position: 'absolute', left: `${m.pct}%`, top: 0, bottom: 0, borderLeft: '1px dashed var(--gray-100)' }} />
              ))}
              <div style={{
                position: 'absolute', left: `${left}%`, width: `${width}%`,
                top: '8px', height: '22px', borderRadius: '5px',
                background: color, opacity: t.statut === 'À faire' ? 0.5 : 1,
                minWidth: '4px', transition: 'all 0.3s',
              }} title={`${t.description} — ${t.statut}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
