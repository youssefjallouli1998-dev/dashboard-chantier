import { genererRelance } from '../../../lib/db.js';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { tache_ids } = req.body;
    if (!Array.isArray(tache_ids) || tache_ids.length === 0) {
      return res.status(400).json({ error: 'tache_ids required' });
    }
    const texte = genererRelance(tache_ids);
    return res.status(200).json({ texte });
  }
  res.status(405).end();
}
