import { getChantier, updateChantier, deleteChantier } from '../../../lib/db.js';

export default function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const c = getChantier(id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(c);
  }

  if (req.method === 'PUT') {
    const updated = updateChantier(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const ok = deleteChantier(id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
