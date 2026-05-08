import { Router, Request, Response } from 'express';
import { http, GHO_BASE } from '../lib/httpClient.js';
import * as cache from '../lib/cache.js';

const router = Router();
const TTL = 60 * 60 * 1000; 

const THREAT_INDICATORS = [
  { code: 'MALARIA_EST_INCIDENCE', weight: 0.25, ceiling: 350 },
  { code: 'CHOLERA_0000000001',    weight: 0.20, ceiling: 5000 },
  { code: 'WHS3_62',               weight: 0.15, ceiling: 10000 },
  { code: 'MDG_0000000001',        weight: 0.25, ceiling: 500 },
  { code: 'RS_IDSR_VPD_06',        weight: 0.15, ceiling: 100 },
] as const;

const REGIONS = [
  { code: 'AFR',  name: 'African Region' },
  { code: 'AMR',  name: 'Region of the Americas' },
  { code: 'SEAR', name: 'South-East Asia Region' },
  { code: 'EUR',  name: 'European Region' },
  { code: 'EMR',  name: 'Eastern Mediterranean Region' },
  { code: 'WPR',  name: 'Western Pacific Region' },
] as const;

type IndicatorDataset = { code: string; data: any[] };

async function fetchIndicatorDatasets(): Promise<IndicatorDataset[]> {
  return Promise.all(
    THREAT_INDICATORS.map(async (ind) => {
      try {
        const { data } = await http.get(
          `${GHO_BASE}${ind.code}?$format=json&$filter=SpatialDimType eq 'REGION'`,
          { timeout: 8_000 },
        );
        return { code: ind.code, data: data?.value ?? [] };
      } catch {
        return { code: ind.code, data: [] };
      }
    }),
  );
}

function computeRegionScore(
  regionCode: string,
  datasets: IndicatorDataset[],
): number {
  let totalWeighted = 0;
  let activeWeights = 0;

  for (const ind of THREAT_INDICATORS) {
    const set = datasets.find((d) => d.code === ind.code);
    if (!set) continue;

    const records = set.data
      .filter((r: any) => r.SpatialDim === regionCode)
      .sort((a: any, b: any) => b.TimeDim - a.TimeDim);

    if (records.length > 0) {
      const raw = Number(records[0].NumericValue ?? records[0].Value ?? 0);
      const normalized = Math.min((raw / ind.ceiling) * 100, 100);
      totalWeighted += normalized * ind.weight;
      activeWeights += ind.weight;
    }
  }

  const rawScore = activeWeights > 0 ? totalWeighted / activeWeights : 0;
  return rawScore > 0 ? Math.max(rawScore, 12.5) : 6.0;
}

router.get('/', async (_req: Request, res: Response) => {
  const key = 'global-baseline';

  const cached = cache.get<unknown[]>(key);
  if (cached) return res.json(cached);

  try {
    const datasets = await fetchIndicatorDatasets();

    const results = REGIONS.map((reg) => ({
      SpatialDim: reg.code,
      NumericValue: parseFloat(computeRegionScore(reg.code, datasets).toFixed(1)),
    }));

    cache.set(key, results, TTL);
    res.json(results);
  } catch {
    res.json([]);
  }
});

export default router;