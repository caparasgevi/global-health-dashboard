import { Router, Request, Response } from 'express';
import { http, GHO_BASE } from '../lib/httpClient.js';
import * as cache from '../lib/cache.js';

const router = Router();
const TTL = 60 * 60 * 1000; 

router.get('/:country/:code', async (req: Request, res: Response) => {
  const { country, code } = req.params;
  const iso = country.toUpperCase();
  const key = `indicator:${iso}:${code}`;

  const cached = cache.get<unknown[]>(key);
  if (cached) return res.json(cached);

  try {
    const url =
      `${GHO_BASE}${code}?$format=json` +
      `&$filter=SpatialDim eq '${iso}'` +
      `&$orderby=TimeDim desc&$top=10`;

    const { data } = await http.get(url);
    const result: unknown[] = data?.value ?? [];
    cache.set(key, result, TTL);
    res.json(result);
  } catch {
    res.json([]);
  }
});

export default router;