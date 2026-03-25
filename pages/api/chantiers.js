import { getChantiers, createChantier } from '../../lib/db.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(getChantiers());
  }
  if (req.method === 'POST') {
    const chantier = createChantier(req.body);
    return res.status(201).json(chantier);
  }
  res.status(405).end();
}
