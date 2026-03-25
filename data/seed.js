export const CHANTIERS_SEED = [
  { id: "ch-1", nom: "RDC Vaugirard — Phase 1/2/3", site: "Hôpital Vaugirard", statut: "En cours", budget_ht: 150000, budget_ttc: 180000, description: "Réaménagement complet du RDC côté gauche et droit.", date_debut: "2025-09-01", date_fin_prevue: "2026-06-30", responsable: "", intervenants: [], zones: [{nom:"RDC Côté gauche",avancement:85},{nom:"RDC Côté droit",avancement:70},{nom:"Bureau secrétariat",avancement:90},{nom:"Chambre de garde",avancement:60}] },
  { id: "ch-2", nom: "Crèche Vaugirard", site: "Hôpital Vaugirard", statut: "En attente", budget_ht: 33000, budget_ttc: 40000, description: "Travaux extérieurs et intérieurs.", date_debut: "2026-04-01", date_fin_prevue: "2026-08-31", responsable: "", intervenants: [], zones: [{nom:"Clôture extérieure",avancement:15},{nom:"Garde-corps intérieur",avancement:5}] },
  { id: "ch-3", nom: "Sous-Sol Vestiaires VGR", site: "Hôpital Vaugirard", statut: "En attente", budget_ht: 15000, budget_ttc: 18000, description: "Rénovation vestiaires sous-sol.", date_debut: "2026-03-01", date_fin_prevue: "2026-05-31", responsable: "", intervenants: [], zones: [{nom:"Vestiaires",avancement:30},{nom:"Salle de détente",avancement:25}] },
  { id: "ch-4", nom: "Local Fauteuil Roulant SS", site: "Hôpital Vaugirard", statut: "En attente", budget_ht: 6600, budget_ttc: 8000, description: "Aménagement local fauteuil roulant.", date_debut: "2026-05-01", date_fin_prevue: "2026-06-30", responsable: "", intervenants: [], zones: [{nom:"Local fauteuil",avancement:0}] },
  { id: "ch-5", nom: "Vestiaires Challancin HEGP", site: "HEGP", statut: "En cours", budget_ht: 75000, budget_ttc: 90000, description: "Rénovation complète des vestiaires Challancin.", date_debut: "2026-03-10", date_fin_prevue: "2026-05-14", responsable: "Youssef JALLOULI", intervenants: ["COPROM","PEINTISOL","SCHNEIDER","ISOPHON","MERI"], zones: [{nom:"Vestiaires hommes",avancement:60},{nom:"Vestiaires femmes",avancement:50},{nom:"Sanitaires",avancement:40}] },
  { id: "ch-6", nom: "Microbiologie HEGP", site: "HEGP", statut: "En cours", budget_ht: 12500, budget_ttc: 15000, description: "Installation évacuation COBAS 5800 et paillasses.", date_debut: "2026-02-01", date_fin_prevue: "2026-04-30", responsable: "", intervenants: ["SCHNEIDER","BMA PAILLASSE"], zones: [{nom:"Évacuation COBAS",avancement:30},{nom:"Paillasses labo",avancement:20}] },
  { id: "ch-7", nom: "Immunologie HEGP", site: "HEGP", statut: "En cours", budget_ht: 4340, budget_ttc: 5200, description: "Sécurisation laboratoire — 7 SALTO.", date_debut: "2026-03-01", date_fin_prevue: "2026-04-15", responsable: "", intervenants: ["SARMATE"], zones: [{nom:"Contrôle accès",avancement:10}] },
  { id: "ch-8", nom: "Crèche HEGP", site: "HEGP", statut: "En cours", budget_ht: 50000, budget_ttc: 60000, description: "Portes coupe-feu et aménagement.", date_debut: "2026-02-15", date_fin_prevue: "2026-05-31", responsable: "", intervenants: ["MERI"], zones: [{nom:"Portes coupe-feu",avancement:45},{nom:"Aménagement intérieur",avancement:35}] },
  { id: "ch-9", nom: "Imagerie HEGP", site: "HEGP", statut: "En attente", budget_ht: 16666, budget_ttc: 20000, description: "Sol et électricité salles d'imagerie.", date_debut: "2026-04-15", date_fin_prevue: "2026-07-31", responsable: "", intervenants: [], zones: [{nom:"Salle scanner",avancement:5},{nom:"Salle IRM",avancement:0}] },
  { id: "ch-10", nom: "Unité Recherche Clinique HEGP", site: "HEGP", statut: "En cours", budget_ht: 10000, budget_ttc: 12000, description: "Isolation, peinture, raccordement.", date_debut: "2026-03-01", date_fin_prevue: "2026-04-30", responsable: "", intervenants: ["COPROM","PEINTISOL","SCHNEIDER"], zones: [{nom:"Isolation thermique",avancement:25},{nom:"Peinture URC",avancement:15}] }
];

export const ENTREPRISES_SEED = [
  { id: "ent-1", nom: "COPROM", contact: "Gilles Martin", telephone: "01 42 00 00 01", email: "contact@coprom.fr", lots: ["Maçonnerie","Cloisons"] },
  { id: "ent-2", nom: "PEINTISOL", contact: "Jonathan Goiset", telephone: "01 42 00 00 02", email: "jonathan.goiset@peintisol.net", lots: ["Peinture","Sol"] },
  { id: "ent-3", nom: "BMA MEUBLE", contact: "Arnaud Legrand", telephone: "01 42 00 00 03", email: "arnaud.legrand@bmabylegrand.fr", lots: ["Menuiserie bois"] },
  { id: "ent-4", nom: "BMA PAILLASSE", contact: "Nicolas Scalabre", telephone: "01 42 00 00 04", email: "nicolas.scalabre@bmabylegrand.fr", lots: ["Paillasses","Équipements"] },
  { id: "ent-5", nom: "SCHNEIDER", contact: "Mickael Schneider", telephone: "01 42 00 00 05", email: "mickael@schneider-cie.fr", lots: ["Plomberie","CVC"] },
  { id: "ent-6", nom: "TERIDEAL", contact: "Vincent Grangeon", telephone: "01 42 00 00 06", email: "vgrangeon@terideal.fr", lots: ["Électricité"] },
  { id: "ent-7", nom: "ISOPHON", contact: "Contact ISOPHON", telephone: "01 42 00 00 07", email: "contact@isophon.fr", lots: ["Faux plafond"] },
  { id: "ent-8", nom: "MERI", contact: "Pierre Pietrement", telephone: "01 42 00 00 08", email: "ppietrement@menuiseriesmeri.com", lots: ["Menuiserie métallique","Portes CF"] },
  { id: "ent-9", nom: "SPIE", contact: "Joao Francisco", telephone: "01 42 00 00 09", email: "joao.francisco@spie.com", lots: ["Détection incendie"] },
  { id: "ent-10", nom: "SARMATE", contact: "Vincent Gilbert", telephone: "01 42 00 00 10", email: "GILBERT.Vincent@sarmates.fr", lots: ["Contrôle accès","Serrurerie"] },
  { id: "ent-11", nom: "DRIOT", contact: "Contact DRIOT", telephone: "01 42 00 00 11", email: "contact@driot.fr", lots: ["Fluides médicaux"] }
];

export const TACHES_SEED = [
  { id: "t-1", chantier_id: "ch-1", zone: "RDC Côté gauche", type_tache: "Pose", description: "Pose revêtement sol côté gauche", statut: "Terminé", entreprise_id: "ent-2", entreprise_nom: "PEINTISOL", date_echeance: "2026-02-28", ordre: 1, duree_jours: 5 },
  { id: "t-2", chantier_id: "ch-1", zone: "RDC Côté gauche", type_tache: "Finition", description: "Peinture côté gauche", statut: "En cours", entreprise_id: "ent-2", entreprise_nom: "PEINTISOL", date_echeance: "2026-03-31", ordre: 2, duree_jours: 7 },
  { id: "t-3", chantier_id: "ch-5", zone: "Vestiaires hommes", type_tache: "Dépose", description: "Dépose faux plafond et sol existant", statut: "Terminé", entreprise_id: "ent-7", entreprise_nom: "ISOPHON", date_echeance: "2026-03-19", ordre: 1, duree_jours: 3 },
  { id: "t-4", chantier_id: "ch-5", zone: "Vestiaires hommes", type_tache: "Pose", description: "Ragréage et pose sol souple", statut: "En cours", entreprise_id: "ent-2", entreprise_nom: "PEINTISOL", date_echeance: "2026-04-21", ordre: 2, duree_jours: 5 },
  { id: "t-5", chantier_id: "ch-5", zone: "Vestiaires femmes", type_tache: "Pose", description: "Pose faïence et carrelage mural", statut: "À faire", entreprise_id: "ent-1", entreprise_nom: "COPROM", date_echeance: "2026-04-07", ordre: 1, duree_jours: 4 }
];

export const DEVIS_SEED = [
  { id: "d-1", chantier_id: "ch-1", entreprise_id: "ent-6", entreprise_nom: "TERIDEAL", montant_ht: 22945.64, montant_ttc: 27534.77, description: "Électricité RDC", date_reception: "2025-05-01", statut: "Accepté", n_devis: "225-1271-D" },
  { id: "d-2", chantier_id: "ch-5", entreprise_id: "ent-1", entreprise_nom: "COPROM", montant_ht: 17157.3, montant_ttc: 20588.76, description: "Maçonnerie Challancin", date_reception: "2026-02-01", statut: "Accepté", n_devis: "DMC8742-1" }
];
