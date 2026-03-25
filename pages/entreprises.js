import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, User } from 'lucide-react';
import Layout from '../components/Layout';
import { Badge, formatEuro } from '../components/ui';

function getInitiales(nom) {
  return nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getEntrepriseStats(entreprise, chantiers, taches, devis) {
  const chActifs = chantiers.filter(c => (c.intervenants || []).includes(entreprise.nom) && c.statut !== 'Terminé');
  const tachesEnt = taches.filter(t => t.entreprise_nom === entreprise.nom);
  const devisEnt = devis.filter(d => d.entreprise_nom === entreprise.nom);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const terminees = tachesEnt.filter(t => t.statut === 'Terminé').length;
  const enCours = tachesEnt.filter(t => t.statut === 'En cours').length;
  const retard = tachesEnt.filter(t => t.statut !== 'Terminé' && t.date_echeance && new Date(t.date_echeance) < today).length;
  const bloquees = tachesEnt.filter(t => t.statut === 'Bloqué').length;
  const devisTtc = devisEnt.reduce((s, d) => s + (d.montant_ttc || 0), 0);

  let badgeColor = 'green';
  let badgeLabel = 'OK';
  if (bloquees > 0) { badgeColor = 'red'; badgeLabel = `${bloquees} bloqué`; }
  else if (retard > 0) { badgeColor = 'amber'; badgeLabel = `${retard} retard`; }

  return { chActifs, tachesEnt, devisEnt, terminees, enCours, retard, bloquees, devisTtc, badgeColor, badgeLabel };
}

export default function Entreprises() {
  const [entreprises, setEntreprises] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [taches, setTaches] = useState([]);
  const [devis, setDevis] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/entreprises').then(r => r.json()),
      fetch('/api/chantiers').then(r => r.json()),
      fetch('/api/taches').then(r => r.json()),
      fetch('/api/devis').then(r => r.json()),
    ]).then(([ent, ch, ta, dv]) => {
      setEntreprises(ent);
      setChantiers(ch);
      setTaches(ta);
      setDevis(dv);
    });
  }, []);

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '28px', color: 'var(--gray-900)' }}>Entreprises</h1>
          <div style={{ fontSize: '13px', color: 'var(--gray-400)' }}>{entreprises.length} sous-traitants</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {entreprises.map(ent => {
          const stats = getEntrepriseStats(ent, chantiers, taches, devis);
          const isOpen = expanded === ent.id;

          return (
            <div key={ent.id} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header ligne */}
              <div
                onClick={() => setExpanded(isOpen ? null : ent.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', cursor: 'pointer' }}
              >
                {/* Initiales */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--blue-light)', color: 'var(--blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '16px',
                }}>
                  {getInitiales(ent.nom)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--gray-900)' }}>{ent.nom}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>
                    {(ent.lots || []).join(' · ')}
                  </div>
                </div>

                <div style={{ display: 'flex', align: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{stats.chActifs.length} chantier{stats.chActifs.length > 1 ? 's' : ''}</span>
                  <Badge color={stats.badgeColor}>{stats.badgeLabel}</Badge>
                  {isOpen ? <ChevronUp size={16} color="var(--gray-400)" /> : <ChevronDown size={16} color="var(--gray-400)" />}
                </div>
              </div>

              {/* Contenu déplié */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--gray-100)', padding: '16px', background: 'var(--gray-50)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                    {/* Colonne gauche : contact */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Contact</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <User size={13} color="var(--gray-400)" />
                          <span style={{ color: 'var(--gray-700)', fontWeight: 500 }}>{ent.contact || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <Phone size={13} color="var(--gray-400)" />
                          <a href={`tel:${ent.telephone}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{ent.telephone || '—'}</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <Mail size={13} color="var(--gray-400)" />
                          <a href={`mailto:${ent.email}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{ent.email || '—'}</a>
                        </div>
                      </div>
                    </div>

                    {/* Colonne droite : stats */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Statistiques</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                          { label: 'Terminées', val: stats.terminees, color: 'var(--green)' },
                          { label: 'En cours', val: stats.enCours, color: 'var(--blue)' },
                          { label: 'En retard', val: stats.retard, color: 'var(--amber)' },
                          { label: 'Devis TTC', val: formatEuro(stats.devisTtc), color: 'var(--gray-700)' },
                        ].map(({ label, val, color }) => (
                          <div key={label} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '18px', color, marginTop: '2px' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chantiers actifs */}
                  {stats.chActifs.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Chantiers actifs</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {stats.chActifs.map(c => (
                          <span key={c.id} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: '#fff', border: '1px solid var(--gray-200)', color: 'var(--gray-700)', fontWeight: 500 }}>
                            {c.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historique devis */}
                  {stats.devisEnt.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Historique devis</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {stats.devisEnt.map(d => (
                          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                            {d.n_devis && <span style={{ fontFamily: 'monospace', color: 'var(--gray-400)', background: 'var(--gray-50)', padding: '2px 6px', borderRadius: '4px' }}>{d.n_devis}</span>}
                            <span style={{ flex: 1, color: 'var(--gray-600)' }}>{d.description}</span>
                            <Badge color={d.statut === 'Accepté' ? 'green' : d.statut === 'Refusé' ? 'red' : 'gray'}>{d.statut}</Badge>
                            <span style={{ fontWeight: 700, color: 'var(--gray-700)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '14px' }}>{formatEuro(d.montant_ttc)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
