import { getAlertes } from '../../lib/db.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(getAlertes());
  }
  res.status(405).end();
}
