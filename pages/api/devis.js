import { getDevis, createDevis } from '../../lib/db.js';

export default function handler(req, res) {
  const { chantier_id } = req.query;

  if (req.method === 'GET') {
    return res.status(200).json(getDevis(chantier_id));
  }

  if (req.method === 'POST') {
    const devis = createDevis(req.body);
    return res.status(201).json(devis);
  }

  res.status(405).end();
}
