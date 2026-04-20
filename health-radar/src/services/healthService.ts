import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api";

export interface Indicator {
  IndicatorCode: string;
  IndicatorName: string;
}

const backendClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

let cachedIndicators: Indicator[] | null = null;
let _indicatorFetchPromise: Promise<Indicator[]> | null = null;
const verificationCache: Record<string, any[]> = {};

const TOP_DISEASES = ['MALARIA_EST_CASES', 'CHOLERA_0000000001', 'WHS3_62', 'MDG_0000000001', 'NTD_DENGUE_CASES', 'RS_196', 'WHS3_41', 'WHS3_42', 'WHS3_40', 'HIV_0000000001'];
const PRIORITY_KWS = ['outbreak', 'epidemic', 'pandemic', 'incidence', 'cholera', 'dengue', 'malaria', 'measles', 'covid', 'sars', 'ebola', 'zika', 'tuberculosis', 'hiv', 'aids', 'hepatitis', 'polio', 'reported cases', 'confirmed cases'];
const BLACKLIST = ['ALCOHOL', 'TOBACCO', 'SMOKING', 'OBESITY', 'FRUIT', 'VEGETABLE', 'EXERCISE', 'PHYSICAL ACTIVITY', 'ROAD TRAFFIC', 'SUICIDE', 'HOMICIDE', 'POISONING', 'AIR POLLUTION', 'SANITATION', 'HYGIENE', 'HEALTH WORKFORCE'];

export const getCachedIndicators = () => cachedIndicators;

// --- Health Service ---
export const healthService = {
  getLiveCountryStats: async (code: string, options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get(`/stats/${code.toUpperCase()}`, {
        signal: options?.signal
      });
      return res.data;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return null;
    }
  },

  getRankedIndicators: async (options?: { signal?: AbortSignal }): Promise<Indicator[]> => {
    // Return cache if exists
    if (cachedIndicators) return cachedIndicators;

    if (!_indicatorFetchPromise) {
      _indicatorFetchPromise = (async () => {
        try {
          const res = await backendClient.get('/indicators', { signal: options?.signal });
          const indicators = res.data;

          if (!indicators || !Array.isArray(indicators)) {
            return [{ IndicatorCode: 'MALARIA_EST_CASES', IndicatorName: 'Malaria Surveillance' }];
          }

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
    return _indicatorFetchPromise;
  },

  getGlobalBaseline: async (options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get('/global-baseline', { 
        signal: options?.signal 
      });
      return res.data || [];
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return [];
    }
  },

  checkIndicatorStatus: async (code: string, country: string, options?: { signal?: AbortSignal }) => {
    const cacheKey = `${country}_${code}`;
    if (verificationCache[cacheKey]) return verificationCache[cacheKey];

    try {
      const res = await backendClient.get('/indicator-status', { 
        params: { code, country },
        signal: options?.signal 
      });
      
      const processed = (res.data || []).map((item: any) => ({
        ...item, 
        _safeValue: item.NumericValue != null ? Number(item.NumericValue) : (Number(item.Value) || 0)
      }));
      
      verificationCache[cacheKey] = processed;
      return processed;
    } catch (error: any) {
      if (axios.isCancel(error)) throw error;
      console.warn(`Indicator ${code} failed for ${country}:`, error.response?.status || error.message);
      return []; 
    }
  },

  getRelevantImage: async (query: string, options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get('/image', { 
        params: { query },
        signal: options?.signal
      });
      // Supports both .url and .imageUrl response shapes
      return res.data.url || res.data.imageUrl || '';
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return '';
    }
  },

  getOutbreakNews: async (limit = 5, options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get('/news', { 
        params: { limit },
        signal: options?.signal
      });
      return res.data || [];
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return [];
    }
  }
};