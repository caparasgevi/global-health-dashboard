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

// Point this to your new Express server
const BACKEND_URL = "http://localhost:5000/api"; 

let cachedIndicators: any[] | null = null;
let _indicatorFetchPromise: Promise<any[]> | null = null; 
const verificationCache: Record<string, any[]> = {};

// ONE client to rule them all. No more separate Pexels, News, or Disease.sh clients!
const backendClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000 
});

export const getCachedIndicators = () => cachedIndicators;

const TOP_DISEASES = ['MALARIA_EST_CASES', 'CHOLERA_0000000001', 'WHS3_62', 'MDG_0000000001', 'NTD_DENGUE_CASES', 'RS_196', 'WHS3_41', 'WHS3_42', 'WHS3_40', 'HIV_0000000001'];
const PRIORITY_KWS = ['outbreak', 'epidemic', 'pandemic', 'incidence', 'cholera', 'dengue', 'malaria', 'measles', 'covid', 'sars', 'ebola', 'zika', 'tuberculosis', 'hiv', 'aids', 'hepatitis', 'polio', 'reported cases', 'confirmed cases'];
const BLACKLIST = ['ALCOHOL', 'TOBACCO', 'SMOKING', 'OBESITY', 'FRUIT', 'VEGETABLE', 'EXERCISE', 'PHYSICAL ACTIVITY', 'ROAD TRAFFIC', 'SUICIDE', 'HOMICIDE', 'POISONING', 'AIR POLLUTION', 'SANITATION', 'HYGIENE', 'HEALTH WORKFORCE'];

export const healthService = {
  getLiveCountryStats: async (code: string, options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get(`/stats/${code.toUpperCase()}`, {
        signal: options?.signal
      });
      const res = await backendClient.get(`/country-stats/${code}`);
      return res.data;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return null;
    }
  },

  getRankedIndicators: async (options?: { signal?: AbortSignal }): Promise<Indicator[]> => {
    try {
      const res = await backendClient.get('/indicators', { 
        signal: options?.signal 
      });
      return res.data || [];
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return [{ IndicatorCode: 'MALARIA_EST_CASES', IndicatorName: 'Malaria Surveillance' }];
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
      const res = await backendClient.get(`/global-baseline`, { signal: options?.signal });
      return res.data;
    } catch { return []; }
  },

  /**
   * FIXED: Handles 500 errors gracefully. 
   * If the backend fails for a specific code/country, return an empty array 
   * instead of letting the error bubble up and stall the UI logic.
   */
  checkIndicatorStatus: async (code: string, country: string, options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get('/indicator-status', { 
        params: { code, country },
        signal: options?.signal 
      });
      return res.data || [];
    } catch (error: any) {
      if (axios.isCancel(error)) throw error;
      const res = await backendClient.get(`/indicator-status/${country}/${code}`, { signal: options?.signal });
      const processed = (res.data || []).map((item: any) => ({
        ...item, 
        _safeValue: item.NumericValue != null ? Number(item.NumericValue) : (Number(item.Value) || 0)
      }));
      
      // Log the specific failed indicator for debugging, but return empty array to keep UI stable
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
      return res.data.url;
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