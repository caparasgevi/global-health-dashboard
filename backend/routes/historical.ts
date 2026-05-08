import { Router, Request, Response } from 'express';
import { http, DISEASE_BASE } from '../lib/httpClient.js';
import * as cache from '../lib/cache.js';

const router = Router();
const TTL = 6 * 60 * 60 * 1000; 

router.get('/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  const key = `historical:${code}`;

  const cached = cache.get<unknown>(key);
  if (cached) return res.json(cached);

  try {
    const { data } = await http.get(`${DISEASE_BASE}/historical/${code}?lastdays=30`);
    const timeline = data?.timeline?.cases ?? null;
    if (!timeline) return res.status(404).json({ error: 'Historical data not found for this region.' });
    cache.set(key, timeline, TTL);
    res.json(timeline);
  } catch {
    res.status(404).json({ error: 'Historical data not found for this region.' });
  }
});

export default router;