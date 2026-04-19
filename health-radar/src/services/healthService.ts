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
    try {
      const res = await backendClient.get('/indicators', { 
        signal: options?.signal 
      });
      return res.data || [];
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return [{ IndicatorCode: 'MALARIA_EST_CASES', IndicatorName: 'Malaria Surveillance' }];
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
  }
};