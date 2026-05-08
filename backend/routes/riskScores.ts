import { Router, Request, Response } from 'express';
import { http, GHO_BASE, DISEASE_BASE } from '../lib/httpClient.js';
import * as cache from '../lib/cache.js';
import {
  buildDiseaseMap,
  buildHistoryMap,
  buildStaticMap,
  buildRiskScore,
} from '../lib/riskScoreHelpers.js';
import staticHealthData from '../healthiest-countries-2026.json' with { type: 'json' };
const router = Router();
const TTL = 15 * 60 * 1000; // 15 min

interface RosterEntry { iso3: string; iso2: string; name: string }

function buildMasterRoster(
  whoCountries: any[],
  diseaseData: any[],
): Map<string, RosterEntry> {
  const roster = new Map<string, RosterEntry>();

  for (const c of whoCountries) {
    if (c.Code) roster.set(c.Code, { iso3: c.Code, iso2: '', name: c.Title });
  }

  for (const c of diseaseData) {
    const iso3 = c.countryInfo?.iso3;
    const iso2 = c.countryInfo?.iso2 ?? '';
    if (!iso3) continue;
    if (roster.has(iso3)) {
      roster.get(iso3)!.iso2 = iso2;
    } else {
      roster.set(iso3, { iso3, iso2, name: c.country });
    }
  }

  if (roster.size === 0) {
    for (const item of staticHealthData as any[]) {
      if (item.country) {
        const iso3 = item.flagCode ?? item.country.substring(0, 3).toUpperCase();
        roster.set(iso3, { iso3, iso2: item.flagCode ?? '', name: item.country });
      }
    }
  }

  return roster;
}

/**
 * GET /api/risk-scores
 *
 * The /historical bulk call is the slowest upstream request (~20s for all countries).
 * We give it a generous independent timeout so it never blocks the critical-path data.
 * Scores still compute correctly without it — countries just get live penalty = 0.
 */
router.get('/', async (_req: Request, res: Response) => {
  const key = 'risk-scores';

  const cached = cache.get<unknown[]>(key);
  if (cached) return res.json(cached);

  try {
    const [diseaseRes, whoRes, historyRes] = await Promise.all([
      http.get(`${DISEASE_BASE}/countries?strict=false`, { timeout: 12_000 })
        .catch((e) => {
          console.warn('[risk-scores] disease/countries failed:', (e as Error).message);
          return { data: [] };
        }),
      http.get(`${GHO_BASE}DIMENSION/COUNTRY/DimensionValues?$format=json`, { timeout: 12_000 })
        .catch((e) => {
          console.warn('[risk-scores] WHO countries failed:', (e as Error).message);
          return { data: { value: [] } };
        }),
      http.get(`${DISEASE_BASE}/historical?lastdays=30`, { timeout: 25_000 })
        .catch((e) => {
          console.warn('[risk-scores] historical timed out — live penalty will be 0:', (e as Error).message);
          return { data: [] };
        }),
    ]);

    const diseaseData: any[]  = Array.isArray(diseaseRes.data)        ? diseaseRes.data        : [];
    const whoCountries: any[] = Array.isArray(whoRes.data?.value)     ? whoRes.data.value      : [];
    const historyData: any[]  = Array.isArray(historyRes.data)        ? historyRes.data        : [];

    console.log(`[risk-scores] upstream — disease:${diseaseData.length} who:${whoCountries.length} history:${historyData.length}`);

    const diseaseMap = buildDiseaseMap(diseaseData);
    const historyMap = buildHistoryMap(historyData);
    const staticMap  = buildStaticMap(staticHealthData as any[]);
    const roster     = buildMasterRoster(whoCountries, diseaseData);

    console.log(`[risk-scores] roster size: ${roster.size}`);

    if (roster.size === 0) {
      console.error('[risk-scores] roster empty — all upstream APIs returned no data');
      return res.status(503).json({ error: 'Upstream health APIs unavailable. Try again shortly.' });
    }

    const riskData = Array.from(roster.values()).map(({ iso3, iso2, name }) => {
      const liveData    = diseaseMap.get(iso3) ?? {};
      const staticEntry =
        (iso2 && staticMap.get(iso2)) ||
        staticMap.get(name.toLowerCase())   ||
        staticMap.get(iso3)                 ||
        {};
      return buildRiskScore(iso3, name, liveData, staticEntry, historyMap);
    });

    const sorted = riskData
      .filter((c) => c.id && c.id.length >= 2)
      .sort((a, b) => b.score - a.score);

    cache.set(key, sorted, TTL);
    res.json(sorted);
  } catch (err) {
    console.error('[risk-scores] unhandled error:', err);
    res.status(500).json({ error: 'Failed to process algorithmic risk scores.' });
  }
});

export default router;