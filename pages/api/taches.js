import { getTaches, createTache, updateTacheStatut, deleteTache, reorderTaches, updateTacheDuree } from '../../lib/db.js';

export default function handler(req, res) {
  const { chantier_id, action, id, zone } = req.query;

  if (req.method === 'GET') {
    return res.status(200).json(getTaches(chantier_id));
  }

  if (req.method === 'POST') {
    if (action === 'reorder') {
      const { ordered_ids } = req.body;
      return res.status(200).json(reorderTaches(chantier_id, zone, ordered_ids));
    }
    const tache = createTache(req.body);
    return res.status(201).json(tache);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id required' });
    if (req.body.duree_jours !== undefined) {
      const updated = updateTacheDuree(id, req.body.duree_jours);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(updated);
    }
    const updated = updateTacheStatut(id, req.body.statut);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id required' });
    const ok = deleteTache(id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
