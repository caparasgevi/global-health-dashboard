import { Router, Request, Response } from 'express';
import { http, GHO_BASE } from '../lib/httpClient.js';
import * as cache from '../lib/cache.js';

const router = Router();
const TTL = 24 * 60 * 60 * 1000; 

router.get('/', async (_req: Request, res: Response) => {
  const key = 'who:indicators';

  const cached = cache.get<unknown>(key);
  if (cached) return res.json(cached);

  try {
    const { data } = await http.get(`${GHO_BASE}Indicator?$format=json`);
    cache.set(key, data, TTL);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch WHO indicators.' });
  }
});

export default router;