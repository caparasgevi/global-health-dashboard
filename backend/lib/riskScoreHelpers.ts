/**
 * Pure risk-score calculation helpers — no I/O, fully testable.
 */

export interface LiveCovidData {
  population?: number;
  cases?: number;
  deaths?: number;
  testsPerOneMillion?: number;
  countryInfo?: { iso2?: string };
}

export interface StaticHealthRecord {
  flagCode?: string;
  country?: string;
  CEOWorldGlobalHealthIndex_2025?: number;
  GlobalHealthSecurityIndex_2021?: number;
}

export interface HistoryRecord {
  country?: string;
  timeline?: { cases?: Record<string, number> };
}

export interface RiskScore {
  id: string;
  name: string;
  score: number;
  fatality: string;
  testingRate: string;
  population: number;
  caseHistory: number[];
  trend: string;
  metrics: { systemic: number; endemic: number; live: number };
}

/** Build an ISO3 → live data lookup from disease.sh response array. */
export function buildDiseaseMap(diseaseData: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const c of diseaseData) {
    if (c.countryInfo?.iso3) map.set(c.countryInfo.iso3, c);
  }
  return map;
}

/** Build a name (lower) → history lookup from disease.sh /historical. */
export function buildHistoryMap(historyData: any[]): Map<string, HistoryRecord> {
  const map = new Map<string, HistoryRecord>();
  for (const h of historyData) {
    if (h.country) map.set(h.country.toLowerCase(), h);
  }
  return map;
}

/** Build ISO2 and name (lower) → static health record lookups. */
export function buildStaticMap(
  staticData: StaticHealthRecord[],
): Map<string, StaticHealthRecord> {
  const map = new Map<string, StaticHealthRecord>();
  for (const item of staticData) {
    if (item.flagCode) map.set(item.flagCode, item);
    if (item.country) map.set(item.country.toLowerCase(), item);
  }
  return map;
}

/** Calculate the live COVID penalty from a 30-day case history. */
export function computeLivePenalty(caseValues: number[], population: number): number {
  if (caseValues.length < 15) return 0;

  const casesToday = caseValues[caseValues.length - 1];
  const cases7DaysAgo = caseValues[caseValues.length - 8];
  const cases14DaysAgo = caseValues[caseValues.length - 15];

  const thisWeek = Math.max(casesToday - cases7DaysAgo, 0);
  const lastWeek = Math.max(cases7DaysAgo - cases14DaysAgo, 0);

  const incidenceRate = (thisWeek / population) * 100_000;
  const incidenceNorm = Math.min((incidenceRate / 500) * 10, 10);

  const growthFactor = lastWeek > 0 ? thisWeek / lastWeek : 1;
  const growthNorm = growthFactor > 1.2 ? Math.min((growthFactor - 1) * 5, 10) : 0;

  return Math.round(incidenceNorm + growthNorm);
}

/** Assemble the full risk score object for a single country. */
export function buildRiskScore(
  iso3: string,
  name: string,
  liveData: any,
  staticData: StaticHealthRecord,
  historyMap: Map<string, HistoryRecord>,
): RiskScore {
  const pop = liveData?.population ?? 1;
  const healthIndex =
    staticData.CEOWorldGlobalHealthIndex_2025 ??
    staticData.GlobalHealthSecurityIndex_2021 ??
    50;

  const rawVulnerability = 100 - healthIndex;
  const systemicRisk = Math.round(rawVulnerability * 0.7);
  const endemicRisk = Math.round(rawVulnerability * 0.3);

  const historyEntry = historyMap.get(name.toLowerCase());
  const caseValues: number[] = historyEntry?.timeline?.cases
    ? (Object.values(historyEntry.timeline.cases) as number[])
    : [];

  const livePenalty = computeLivePenalty(caseValues, pop);
  const finalScore = Math.min(systemicRisk + endemicRisk + livePenalty, 100);

  const cases = liveData?.cases ?? 0;
  const deaths = liveData?.deaths ?? 0;
  const CFR = cases > 0 ? deaths / cases : 0;

  return {
    id: iso3,
    name,
    score: finalScore,
    fatality: `${(CFR * 100).toFixed(2)}%`,
    testingRate: (liveData?.testsPerOneMillion ?? 0).toLocaleString(),
    population: pop,
    caseHistory: caseValues,
    trend: finalScore > 75 ? 'Global Emergency' : 'Stable',
    metrics: { systemic: systemicRisk, endemic: endemicRisk, live: livePenalty },
  };
}