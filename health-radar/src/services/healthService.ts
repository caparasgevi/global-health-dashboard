import axios, { type AxiosRequestConfig } from 'axios';

const PEXELS_API_KEY = 'hYFskVoWAFWOb07jdYwLTERl8UUKPKhLmoKWqF54RubZBeDiwuslJpy4';
const BASE_URL = "/gho-api/";
const apiClient = axios.create({
  baseURL: BASE_URL
});

const newsClient = axios.create({
  baseURL: "/who-news/"
});

export const healthService = {
  getGlobalBaseline: async (options?: { signal?: AbortSignal }) => {
    const url = `WHOSIS_000001?$filter=TimeDim eq 2021 and SpatialDimType eq 'REGION'`;
    const config: AxiosRequestConfig = {
      signal: options?.signal
    };

    const res = await apiClient.get(url, config);
    return res.data.value;
  },

  getAllIndicators: async (options?: { signal?: AbortSignal }) => {
    const config: AxiosRequestConfig = {
      signal: options?.signal
    };

    const res = await apiClient.get(`Indicator?$format=json`, config);
    return res.data.value;
  },

  checkIndicatorStatus: async (
    code: string,
    countryCode: string,
    options?: { signal?: AbortSignal }
  ) => {
    const url = `${code}?$format=json&$filter=SpatialDim eq '${countryCode}'&$top=1`;

    const config: AxiosRequestConfig = {
      signal: options?.signal
    };

    const res = await apiClient.get(url, config);
    return res.data.value;
  },

  getRelevantImage: async (query: string) => {
    try {
      const res = await axios.get(`https://api.pexels.com/v1/search`, {
        headers: { Authorization: PEXELS_API_KEY },
        params: {
          query: `${query} medical disease`,
          per_page: 1,
          orientation: 'landscape'
        }
      });
      return res.data.photos[0]?.src?.large || '';
    } catch (error) {
      console.error("Pexels fetch error:", error);
      return '';
    }
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

      const items = res.data?.value || [];
      return items.map((item: any) => ({
        id: item.Id,
        title: item.Title,
        date: item.PublicationDateAndTime,
        summary: item.Summary || '',
        url: item.ItemDefaultUrl ? `https://www.who.int${item.ItemDefaultUrl}` : '',
        image: '' 
      }));
    } catch (error) {
      console.error("WHO News fetch error:", error);
      return [];
    }
  }
};