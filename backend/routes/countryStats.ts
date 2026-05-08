import { Router, Request, Response } from 'express';
import { http, DISEASE_BASE } from '../lib/httpClient.js';
import * as cache from '../lib/cache.js';

const router = Router();
const TTL = 5 * 60 * 1000; 

router.get('/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  const key = `country-stats:${code}`;

  const cached = cache.get<unknown>(key);
  if (cached) return res.json(cached);

  try {
    const { data } = await http.get(`${DISEASE_BASE}/countries/${code}?strict=false`);
    cache.set(key, data, TTL);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch country stats.' });
  }
});

export default router;