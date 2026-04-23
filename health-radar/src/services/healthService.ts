import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

let cachedIndicators: any[] | null = null;
let _indicatorFetchPromise: Promise<any[]> | null = null; 
const verificationCache: Record<string, any[]> = {};

const backendClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000
});

export const getCachedIndicators = () => cachedIndicators;

const TOP_DISEASES = [
  'MALARIA_EST_CASES', 'CHOLERA_0000000001', 'WHS3_62', 'MDG_0000000001', 
  'NTD_DENGUE_CASES', 'RS_196', 'WHS3_41', 'WHS3_42', 'WHS3_40', 'HIV_0000000001',
  'NTD_LEISH_CASES', // Leishmaniasis
  'NTD_LEP_NEWC',    // Leprosy
  'NTD_RABIES_DEATHS', // Rabies
  'WHS3_47',         // Polio
  'WHS3_49',         // Meningitis
  'WHS3_51',         // Diphtheria
  'WHS3_52',         // Pertussis
  'WHS3_53',         // Tetanus
  'WHS3_54',         // Yellow fever
  'WHS3_55',         // Haemophilus influenzae
  'WHS3_56',         // Japanese encephalitis
  'WHS3_63',         // Guinea worm
  'WHS3_64',         // Sleeping sickness
  'WHS3_65',         // Chagas
  'WHS3_66'          // Trachoma
];

const PRIORITY_KWS = [
  'outbreak', 'epidemic', 'pandemic', 'incidence', 'cholera', 'dengue', 
  'malaria', 'measles', 'covid', 'sars', 'ebola', 'zika', 'tuberculosis', 
  'hiv', 'aids', 'hepatitis', 'polio', 'reported cases', 'confirmed cases',
  'mpox', 'monkeypox', 'avian flu', 'h5n1', 'marburg', 'lassa', 'nipah', 'anthrax',
  'meningitis', 'diphtheria', 'pertussis', 'tetanus', 'yellow fever', 'leishmaniasis', 'leprosy'
];

const BLACKLIST = [
  'ALCOHOL', 'TOBACCO', 'SMOKING', 'OBESITY', 'FRUIT', 'VEGETABLE', 
  'EXERCISE', 'PHYSICAL ACTIVITY', 'ROAD TRAFFIC', 'SUICIDE', 'HOMICIDE', 
  'POISONING', 'AIR POLLUTION', 'SANITATION', 'HYGIENE', 'HEALTH WORKFORCE',
  'DIABETES', 'CANCER', 'CARDIOVASCULAR', 'MATERNAL', 'WATER', 'NUTRITION'
];

export const healthService = {
  getLiveCountryStats: async (code: string) => {
    try {
      const res = await backendClient.get(`/country-stats/${code}`);
      return res.data;
    } catch { return null; }
  },

  getHistoricalData: async (code: string) => {
    try {
      const res = await backendClient.get(`/historical/${code}`);
      return res.data;
    } catch { return null; }
  },

  getRiskScores: async () => {
    try {
      const res = await backendClient.get(`/risk-scores`);
      return res.data || [];
    } catch { return []; }
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
            
            // 1. Filter out chronic/lifestyle conditions first
            if (BLACKLIST.some(k => name.includes(k) || code.includes(k))) return false;
            
            // 2. Keep only high-priority infectious diseases from expanded lists
            return TOP_DISEASES.includes(code) || PRIORITY_KWS.some(k => name.toLowerCase().includes(k.toLowerCase()));
          });
          
          return cachedIndicators.length > 0 ? cachedIndicators : indicators.slice(0, 100);
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

  getEndemicData: async (countryCode: string, indicatorCode: string) => {
    try {
      const res = await backendClient.get(`/indicator-status/${countryCode}/${indicatorCode}`);
      return res.data; 
    } catch { return []; }
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

  getCountrySpecificAlerts: async (iso3: string, options?: { signal?: AbortSignal }) => {
    try {
      const url = `https://api.reliefweb.int/v1/reports?appname=globalhealth&query[value]="outbreak" OR "epidemic" OR "disease"&filter[field]=country.iso3&filter[value]=${iso3.toLowerCase()}&fields[include][]=title&fields[include][]=date&fields[include][]=url&limit=6&sort[]=date:desc`;
      const res = await axios.get(url, { signal: options?.signal });
      return (res.data?.data || []).map((item: any) => ({
        title: item.fields?.title || 'Health Alert',
        date: item.fields?.date?.created || new Date().toISOString(),
        url: item.fields?.url || item.href,
        summary: 'Recent health incident reported in this region.'
      }));
    } catch { 
      return []; 
    }
  },

  getRealtimeDiseaseStats: async (iso3: string) => {
    try {
      const res = await axios.get(`https://disease.sh/v3/covid-19/countries/${iso3}`);
      const data = res.data;
      return [
        { name: "COVID-19 (Active Cases)", value: data.active, year: new Date().getFullYear(), type: "Acute" },
        { name: "COVID-19 (Critical)", value: data.critical, year: new Date().getFullYear(), type: "Acute" }
      ];
    } catch {
      return [];
    }
  },
  
  getOutbreakNews: async (limit = 5, options?: { signal?: AbortSignal }) => {
    try {
      const res = await backendClient.get(`/outbreak-news`, { 
        signal: options?.signal,
        params: { limit }
      });
      return res.data || [];
    } catch { return []; }
  },
};