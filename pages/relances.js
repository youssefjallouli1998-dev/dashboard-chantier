import { useState, useEffect } from 'react';
import { Copy, Check, AlertTriangle, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import { KpiCard, StatutBadge, Btn, formatDate } from '../components/ui';

export default function Relances() {
  const [alertes, setAlertes] = useState({ retards: [], bloques: [], chantiers_bloques: [] });
  const [selected, setSelected] = useState([]);
  const [texte, setTexte] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chantiers, setChantiers] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/alertes').then(r => r.json()),
      fetch('/api/chantiers').then(r => r.json()),
    ]).then(([al, ch]) => {
      setAlertes(al);
      setChantiers(ch);
    });
  }, []);

  const allTaches = [...(alertes.retards || []), ...(alertes.bloques || [])];
  // Deduplicate
  const tachesUniq = allTaches.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);

  function getChantierNom(chantier_id) {
    return chantiers.find(c => c.id === chantier_id)?.nom || chantier_id;
  }

  function toggleAll() {
    if (selected.length === tachesUniq.length) {
      setSelected([]);
    } else {
      setSelected(tachesUniq.map(t => t.id));
    }
  }

  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function generer() {
    if (selected.length === 0) return;
    setGenerating(true);
    setTexte('');
    const res = await fetch('/api/relances/generer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tache_ids: selected }),
    });
    const data = await res.json();
    setTexte(data.texte || '');
    setGenerating(false);
  }

  async function copier() {
    await navigator.clipboard.writeText(texte);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const alertCount = tachesUniq.length;
  const retardCount = alertes.retards?.length || 0;
  const bloqueCount = alertes.bloques?.length || 0;
  const chantiersBloques = alertes.chantiers_bloques?.length || 0;

  return (
    <Layout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '28px', color: 'var(--gray-900)' }}>Relances</h1>
        <div style={{ fontSize: '13px', color: 'var(--gray-400)' }}>Gestion des retards et blocages</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <KpiCard label="Tâches en retard" value={retardCount} color={retardCount > 0 ? 'var(--amber)' : 'var(--green)'} sub="Échéance dépassée" />
        <KpiCard label="Tâches bloquées" value={bloqueCount} color={bloqueCount > 0 ? 'var(--red)' : 'var(--green)'} sub="Statut bloqué" />
        <KpiCard label="Chantiers bloqués" value={chantiersBloques} color={chantiersBloques > 0 ? 'var(--red)' : 'var(--green)'} sub="À débloquer" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Colonne gauche : liste */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--gray-700)' }}>
              {alertCount} tâche{alertCount > 1 ? 's' : ''} à relancer
            </span>
            {tachesUniq.length > 0 && (
              <button
                onClick={toggleAll}
                style={{ fontSize: '12px', color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                {selected.length === tachesUniq.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            )}
          </div>

          {tachesUniq.length === 0 ? (
            <div style={{ background: 'var(--green-light)', border: '1px solid #86EFAC', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <Check size={24} color="var(--green)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, color: '#15803D', fontSize: '14px' }}>Aucun retard ni blocage</div>
              <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px' }}>Tous les chantiers sont à jour</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Retards */}
              {(alertes.retards || []).length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} /> En retard
                  </div>
                  {alertes.retards.map(t => (
                    <TacheRelanceItem
                      key={t.id} tache={t}
                      chantierNom={getChantierNom(t.chantier_id)}
                      selected={selected.includes(t.id)}
                      onToggle={() => toggle(t.id)}
                      type="retard"
                    />
                  ))}
                </>
              )}

              {/* Bloqués */}
              {(alertes.bloques || []).length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 0', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle size={12} /> Bloqués
                  </div>
                  {alertes.bloques.map(t => (
                    <TacheRelanceItem
                      key={t.id} tache={t}
                      chantierNom={getChantierNom(t.chantier_id)}
                      selected={selected.includes(t.id)}
                      onToggle={() => toggle(t.id)}
                      type="bloque"
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Colonne droite : génération */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--gray-700)' }}>Email de relance</span>
            <Btn onClick={generer} disabled={selected.length === 0 || generating} size="sm">
              {generating ? 'Génération…' : `Générer (${selected.length} sélectionné${selected.length > 1 ? 's' : ''})`}
            </Btn>
          </div>

          {texte ? (
            <div>
              <textarea
                value={texte}
                onChange={e => setTexte(e.target.value)}
                style={{
                  width: '100%', minHeight: '320px', padding: '14px',
                  border: '1px solid var(--gray-200)', borderRadius: '10px',
                  fontSize: '13px', lineHeight: '1.6', resize: 'vertical',
                  fontFamily: 'Public Sans, sans-serif', color: 'var(--gray-700)',
                  background: '#fff',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Btn onClick={copier} variant={copied ? 'secondary' : 'primary'}>
                  {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier</>}
                </Btn>
              </div>
            </div>
          ) : (
            <div style={{
              border: '2px dashed var(--gray-200)', borderRadius: '10px',
              padding: '40px', textAlign: 'center', color: 'var(--gray-400)',
              minHeight: '200px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <div style={{ fontSize: '32px', lineHeight: 1 }}>✉️</div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Sélectionnez des tâches puis cliquez sur "Générer"</div>
              <div style={{ fontSize: '12px' }}>Le texte sera groupé par entreprise</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function TacheRelanceItem({ tache, chantierNom, selected, onToggle, type }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        background: selected ? 'var(--blue-light)' : '#fff',
        border: `1px solid ${selected ? 'var(--blue)' : 'var(--gray-200)'}`,
        borderRadius: '8px', padding: '10px 12px', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '1px',
        border: `2px solid ${selected ? 'var(--blue)' : 'var(--gray-300)'}`,
        background: selected ? 'var(--blue)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <Check size={11} color="#fff" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--gray-900)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tache.description}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
          {chantierNom} — {tache.zone}
          {tache.date_echeance && <span style={{ color: type === 'retard' ? 'var(--amber)' : 'var(--red)', marginLeft: '6px', fontWeight: 600 }}>
            {formatDate(tache.date_echeance)}
          </span>}
        </div>
        {tache.entreprise_nom && (
          <div style={{ fontSize: '11px', color: 'var(--blue)', marginTop: '2px', fontWeight: 500 }}>{tache.entreprise_nom}</div>
        )}
      </div>
    </div>
  );
}
