import axios from 'axios';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const BASE_URL = "/gho-api/";
const DISEASE_SH_BASE_URL = "https://disease.sh"; 

let cachedIndicators: any[] | null = null;
let _indicatorFetchPromise: Promise<any[]> | null = null; 

// FIX: This now correctly caches results per country + indicator
const verificationCache: Record<string, any[]> = {};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000 
});

const newsClient = axios.create({
  baseURL: "/who-news/"
});

const diseaseShClient = axios.create({
  baseURL: DISEASE_SH_BASE_URL
});

const pexelsClient = axios.create({
  baseURL: "https://api.pexels.com/v1",
  headers: {
    Authorization: PEXELS_API_KEY
  }
});

export {
  apiClient,
  newsClient,
  diseaseShClient,
  pexelsClient,
  PEXELS_API_KEY
};

export const getCachedIndicators = () => cachedIndicators;

const TOP_DISEASES = ['MALARIA_EST_CASES', 'CHOLERA_0000000001', 'WHS3_62', 'MDG_0000000001', 'NTD_DENGUE_CASES', 'RS_196', 'WHS3_41', 'WHS3_42', 'WHS3_40', 'HIV_0000000001'];
const PRIORITY_KWS = ['outbreak', 'epidemic', 'pandemic', 'incidence', 'cholera', 'dengue', 'malaria', 'measles', 'covid', 'sars', 'ebola', 'zika', 'tuberculosis', 'hiv', 'aids', 'hepatitis', 'polio', 'reported cases', 'confirmed cases'];
const BLACKLIST = ['ALCOHOL', 'TOBACCO', 'SMOKING', 'OBESITY', 'FRUIT', 'VEGETABLE', 'EXERCISE', 'PHYSICAL ACTIVITY', 'ROAD TRAFFIC', 'SUICIDE', 'HOMICIDE', 'POISONING', 'AIR POLLUTION', 'SANITATION', 'HYGIENE', 'HEALTH WORKFORCE'];

export const healthService = {
  getLiveCountryStats: async (code: string) => {
    try {
      const res = await diseaseShClient.get(`v3/covid-19/countries/${code.toUpperCase()}?strict=false`);
      return res.data;
    } catch { return null; }
  },

  getRankedIndicators: async (options?: { signal?: AbortSignal }) => {
    if (cachedIndicators) return cachedIndicators;

    if (!_indicatorFetchPromise) {
      _indicatorFetchPromise = (async () => {
        try {
          const res = await apiClient.get(`Indicator?$format=json`);
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
    const res = await apiClient.get(`WHOSIS_000001?$filter=TimeDim eq 2021 and SpatialDimType eq 'REGION'`, { signal: options?.signal });
    return res.data.value;
  },

  checkIndicatorStatus: async (code: string, country: string, options?: { signal?: AbortSignal }) => {
    const cacheKey = `${country}_${code}`;
    if (verificationCache[cacheKey]) return verificationCache[cacheKey];

    try {
      const res = await apiClient.get(`${code}?$format=json&$filter=SpatialDim eq '${country.toUpperCase()}'&$orderby=TimeDim desc&$top=10`, { signal: options?.signal });
      const processed = (res.data.value || []).map((item: any) => ({
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
    const res = await pexelsClient.get(`/search`, { 
      params: { 
        query: `${query} medical disease`, 
        per_page: 1, 
        orientation: 'landscape' 
      } 
    });
    return res.data.photos[0]?.src?.large || '';
  } catch { return ''; }
},

  getOutbreakNews: async (limit = 5, options?: { signal?: AbortSignal }) => {
    try {
      const res = await newsClient.get('api/news/diseaseoutbreaknews', { 
        signal: options?.signal, 
        params: { 
          '$top': limit, 
          '$select': 'Id,Title,PublicationDateAndTime,Summary,ItemDefaultUrl', 
          '$orderby': 'PublicationDateAndTime desc', 
          'sf_culture': 'en' 
        } 
      });
      return (res.data?.value || []).map((i: any) => ({ 
        id: i.Id, 
        title: i.Title, 
        date: i.PublicationDateAndTime, 
        summary: i.Summary || '', 
        url: i.ItemDefaultUrl ? `https://www.who.int${i.ItemDefaultUrl}` : '' 
      }));
    } catch { return []; }
  }
};