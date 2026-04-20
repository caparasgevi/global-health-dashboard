import axios from 'axios';

const BACKEND_URL = "https://my-backend-api-es7e.onrender.com/api";

let cachedIndicators: any[] | null = null;
let _indicatorFetchPromise: Promise<any[]> | null = null; 
const verificationCache: Record<string, any[]> = {};

const backendClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000 
});

export const getCachedIndicators = () => cachedIndicators;

const TOP_DISEASES = ['MALARIA_EST_CASES', 'CHOLERA_0000000001', 'WHS3_62', 'MDG_0000000001', 'NTD_DENGUE_CASES', 'RS_196', 'WHS3_41', 'WHS3_42', 'WHS3_40', 'HIV_0000000001'];
const PRIORITY_KWS = ['outbreak', 'epidemic', 'pandemic', 'incidence', 'cholera', 'dengue', 'malaria', 'measles', 'covid', 'sars', 'ebola', 'zika', 'tuberculosis', 'hiv', 'aids', 'hepatitis', 'polio', 'reported cases', 'confirmed cases'];
const BLACKLIST = ['ALCOHOL', 'TOBACCO', 'SMOKING', 'OBESITY', 'FRUIT', 'VEGETABLE', 'EXERCISE', 'PHYSICAL ACTIVITY', 'ROAD TRAFFIC', 'SUICIDE', 'HOMICIDE', 'POISONING', 'AIR POLLUTION', 'SANITATION', 'HYGIENE', 'HEALTH WORKFORCE'];

export const healthService = {
  getLiveCountryStats: async (code: string) => {
    try {
      const res = await backendClient.get(`/country-stats/${code}`);
      return res.data;
    } catch { return null; }
  },

  getRankedIndicators: async (options?: { signal?: AbortSignal }) => {
    if (cachedIndicators) return cachedIndicators;

    if (!_indicatorFetchPromise) {
      _indicatorFetchPromise = (async () => {
        try {
          const res = await backendClient.get(`/indicators`);
          const indicators = res.data?.value;
          if (!indicators || !Array.isArray(indicators)) return [{ IndicatorCode: 'MALARIA_EST_CASES', IndicatorName: 'Malaria Surveillance' }];

          cachedIndicators = indicators.filter((ind: any) => {
            if (!ind?.IndicatorName) return false;
            const name = ind.IndicatorName.toUpperCase();
            const code = (ind.IndicatorCode || '').toUpperCase();
            if (BLACKLIST.some(k => name.includes(k) || code.includes(k))) return false;
            return TOP_DISEASES.includes(code) || PRIORITY_KWS.some(k => name.toLowerCase().includes(k.toLowerCase()));
          });
          return cachedIndicators.length > 0 ? cachedIndicators : indicators.slice(0, 50);
        } catch (error) {
          _indicatorFetchPromise = null; 
          if (axios.isCancel(error)) throw error;
          return [{ IndicatorCode: 'MALARIA_EST_CASES', IndicatorName: 'Malaria Surveillance' }];
        }
      })();
    }

    if (!options?.signal) return _indicatorFetchPromise;
    return Promise.race([
      _indicatorFetchPromise,
      new Promise<any[]>((_, reject) => {
        options.signal!.addEventListener('abort', () => reject(new axios.Cancel('Request aborted')), { once: true });
      })
    ]);
  },

  getGlobalBaseline: async (options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get(`/global-baseline`, { signal: options?.signal });
      return res.data;
    } catch { return []; }
  },

  checkIndicatorStatus: async (code: string, country: string, options?: { signal?: AbortSignal }) => {
    const cacheKey = `${country}_${code}`;
    if (verificationCache[cacheKey]) return verificationCache[cacheKey];

    try {
      const res = await backendClient.get(`/indicator-status/${country}/${code}`, { signal: options?.signal });
      const processed = (res.data || []).map((item: any) => ({
        ...item, 
        _safeValue: item.NumericValue != null ? Number(item.NumericValue) : (Number(item.Value) || 0)
      }));
      
      verificationCache[cacheKey] = processed;
      return processed;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return [];
    }
  },

  getRelevantImage: async (query: string) => {
    try {
      const res = await backendClient.get(`/relevant-image`, { params: { query } });
      return res.data.imageUrl || '';
    } catch { return ''; }
  },

  getOutbreakNews: async (limit = 5, options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get(`/outbreak-news`, { 
        signal: options?.signal,
        params: { limit }
      });
      return res.data || [];
    } catch { return []; }
  }
};