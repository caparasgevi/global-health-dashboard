import { Router, Request, Response } from 'express';
import { http } from '../lib/httpClient.js';
import * as cache from '../lib/cache.js';

const router = Router();
const TTL = 60 * 60 * 1000; 
const FALLBACK = 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg';

router.get('/', async (req: Request, res: Response) => {
  const query = String(req.query.query ?? '').trim();
  if (!query) return res.json({ imageUrl: FALLBACK });

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return res.json({ imageUrl: FALLBACK });

  const key = `relevant-image:${query}`;
  const cached = cache.get<{ imageUrl: string }>(key);
  if (cached) return res.json(cached);

  try {
    const { data } = await http.get('https://api.pexels.com/v1/search', {
      params: { query: `${query} medical disease`, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: apiKey },
      timeout: 6_000,
    });
    const imageUrl = data.photos[0]?.src?.large ?? FALLBACK;
    const result = { imageUrl };
    cache.set(key, result, TTL);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch image.' });
  }
});

export default router;