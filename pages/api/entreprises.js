import { getEntreprises } from '../../lib/db.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(getEntreprises());
  }
  res.status(405).end();
}
