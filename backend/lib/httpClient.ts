import axios from 'axios';

export const http = axios.create({
  timeout: 10_000,
});

/** WHO GHO REST API base URL */
export const GHO_BASE = 'https://ghoapi.azureedge.net/api/';

/** disease.sh COVID API base URL */
export const DISEASE_BASE = 'https://disease.sh/v3/covid-19';