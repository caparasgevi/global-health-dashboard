import axios, { type AxiosRequestConfig } from 'axios';

const PROXY = "https://cors-anywhere.herokuapp.com/";
const BASE_URL = "https://ghoapi.azureedge.net/api/";

const apiClient = axios.create({
  baseURL: `${PROXY}${BASE_URL}`
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
  }
};