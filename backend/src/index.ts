import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

import staticHealthDataRaw from '../healthiest-countries-2026.json' with { type: 'json' };

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const GHO_BASE_URL = 'https://ghoapi.azureedge.net/api/';

app.use(cors());
app.use(express.json());

<<<<<<< HEAD
const staticDataPath = path.join(__dirname, '..', 'healthiest-countries-2026.json');
let staticHealthData: any[] = [];
try {
  staticHealthData = JSON.parse(fs.readFileSync(staticDataPath, 'utf-8'));
  console.log('✅ Successfully loaded static health index JSON.');
} catch (e) {
  console.warn('⚠️ Could not load healthiest-countries-2026.json. Ensure it is in the root backend folder.');
}
=======
// Initialize the imported JSON data
const staticHealthData: any[] = staticHealthDataRaw;
console.log('✅ Successfully loaded static health index JSON.');
>>>>>>> 03362f6db9bfeec02e16a16aa7cc0251532f79ac

app.get('/', (req, res) => {
  res.send('Health Radar API is Live and Running.');
});

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ message: 'Health Radar backend is online and tracking.' });
});

app.get('/api/country-stats/:code', async (req: Request, res: Response) => {
  const countryCode = req.params.code;
  try {
    const response = await axios.get(`https://disease.sh/v3/covid-19/countries/${countryCode}?strict=false`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch country stats.' });
  }
});

app.get('/api/indicator-status/:country/:code', async (req: Request, res: Response) => {
  const { country, code } = req.params;
  try {
    const response = await axios.get(
      `${GHO_BASE_URL}${code}?$format=json&$filter=SpatialDim eq '${String(country).toUpperCase()}'&$orderby=TimeDim desc&$top=10`,
      { timeout: 10000 }
    );
    
    const data = response.data?.value || [];
    res.json(data);
  } catch (error) {
    console.error(`WHO API error for ${code} in ${country}`);
    res.json([]); 
  }
});

app.get('/api/historical/:code', async (req: Request, res: Response) => {
  const countryCode = req.params.code;
  try {
    const response = await axios.get(`https://disease.sh/v3/covid-19/historical/${countryCode}?lastdays=30`);
    res.json(response.data?.timeline?.cases || null);
  } catch (error) {
    res.status(404).json({ error: 'Historical data not found for this region.' });
  }
});

app.get('/api/indicators', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${GHO_BASE_URL}Indicator?$format=json`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch WHO indicators.' });
  }
});

let threatCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; 

app.get('/api/global-baseline', async (req: Request, res: Response) => {
  const now = Date.now();
  if (threatCache && now - lastFetchTime < CACHE_DURATION) {
    return res.json(threatCache);
  }

  const THREAT_INDICATORS = [
    { code: 'MALARIA_EST_INCIDENCE', weight: 0.25, ceiling: 350 },
    { code: 'CHOLERA_0000000001',    weight: 0.20, ceiling: 5000 },
    { code: 'WHS3_62',               weight: 0.15, ceiling: 10000 },
    { code: 'MDG_0000000001',        weight: 0.25, ceiling: 500 },
    { code: 'RS_IDSR_VPD_06',        weight: 0.15, ceiling: 100 },
  ];

  const REGIONS = [
    { code: 'AFR',  name: 'African Region' },
    { code: 'AMR',  name: 'Region of the Americas' },
    { code: 'SEAR', name: 'South-East Asia Region' },
    { code: 'EUR',  name: 'European Region' },
    { code: 'EMR',  name: 'Eastern Mediterranean Region' },
    { code: 'WPR',  name: 'Western Pacific Region' },
  ];

  try {
    const datasetResponses = await Promise.all(
      THREAT_INDICATORS.map(async (ind) => {
        try {
          const res = await axios.get(`${GHO_BASE_URL}${ind.code}?$format=json&$filter=SpatialDimType eq 'REGION'`, { timeout: 8000 });
          return { code: ind.code, data: res.data?.value || [] };
        } catch (e) {
          return { code: ind.code, data: [] };
        }
      })
    );

    const results = REGIONS.map((reg) => {
      let totalWeightedScore = 0;
      let activeWeights = 0;

      THREAT_INDICATORS.forEach((ind) => {
        const set = datasetResponses.find((r) => r.code === ind.code);
        const data = set ? set.data : [];
        const regRecords = data
          .filter((d: any) => d.SpatialDim === reg.code)
          .sort((a: any, b: any) => b.TimeDim - a.TimeDim);

        if (regRecords.length > 0) {
          const rawValue = Number(regRecords[0].NumericValue || regRecords[0].Value || 0);
          const normalized = Math.min((rawValue / ind.ceiling) * 100, 100);
          totalWeightedScore += normalized * ind.weight;
          activeWeights += ind.weight;
        }
      });

      const finalRawValue = activeWeights > 0 ? (totalWeightedScore / activeWeights) : 0;
      const displayValue = finalRawValue > 0 ? Math.max(finalRawValue, 12.5) : 6.0;

      return { SpatialDim: reg.code, NumericValue: parseFloat(displayValue.toFixed(1)) };
    });

    threatCache = results;
    lastFetchTime = now;
    res.json(results);
  } catch (error) {
    res.json(threatCache || []);
  }
});

app.get('/api/risk-scores', async (req: Request, res: Response) => {
  try {
    const staticMap = new Map();
    staticHealthData.forEach(item => {
      if (item.flagCode) staticMap.set(item.flagCode, item);
      if (item.country) staticMap.set(item.country.toLowerCase(), item);
    });

    const [diseaseResponse, whoResponse, historyResponse] = await Promise.all([
      axios.get('https://disease.sh/v3/covid-19/countries?strict=false', { timeout: 8000 }).catch(() => ({ data: [] })),
      axios.get(`${GHO_BASE_URL}DIMENSION/COUNTRY/DimensionValues?$format=json`, { timeout: 8000 }).catch(() => ({ data: { value: [] } })),
      axios.get('https://disease.sh/v3/covid-19/historical?lastdays=30', { timeout: 8000 }).catch(() => ({ data: [] }))
    ]);

    const diseaseData = Array.isArray(diseaseResponse.data) ? diseaseResponse.data : [];
    const whoCountries = Array.isArray(whoResponse.data?.value) ? whoResponse.data.value : [];
    const historyData = Array.isArray(historyResponse.data) ? historyResponse.data : [];

    const masterRoster = new Map();
    const diseaseMap = new Map();
    const historyMap = new Map();

    historyData.forEach((h: any) => {
        if(h.country) historyMap.set(h.country.toLowerCase(), h);
    });

    whoCountries.forEach((c: any) => {
      if (c.Code) masterRoster.set(c.Code, { iso3: c.Code, name: c.Title });
    });

    diseaseData.forEach((c: any) => {
      if (c.countryInfo && c.countryInfo.iso3) {
        diseaseMap.set(c.countryInfo.iso3, c); 
        if (!masterRoster.has(c.countryInfo.iso3)) {
          masterRoster.set(c.countryInfo.iso3, { iso3: c.countryInfo.iso3, name: c.country });
        }
      }
    });

    if (masterRoster.size === 0) {
      staticHealthData.forEach(item => {
        if (item.country) {
          const fallbackIso = item.flagCode || item.country.substring(0,3).toUpperCase();
          masterRoster.set(fallbackIso, { iso3: fallbackIso, name: item.country });
        }
      });
    }

    const riskData = Array.from(masterRoster.values()).map((countryObj: any) => {
      const iso3 = countryObj.iso3;
      const name = countryObj.name || ''; 

      const liveData = diseaseMap.get(iso3) || {};
      const iso2 = liveData.countryInfo?.iso2;
      const pop = liveData.population || 1;
      
      const nameLower = name ? name.toLowerCase() : '';
      const staticData = staticMap.get(iso2) || staticMap.get(nameLower) || {};

      const healthIndex = staticData.CEOWorldGlobalHealthIndex_2025 || staticData.GlobalHealthSecurityIndex_2021 || 50;
      const rawVulnerability = 100 - healthIndex;

      const systemicRisk = Math.round(rawVulnerability * 0.70);
      const endemicRisk = Math.round(rawVulnerability * 0.30);

      let livePenalty = 0;
      let caseValues: number[] = [];
      const history = historyMap.get(nameLower);
      
      if (history && history.timeline && history.timeline.cases) {
          const casesObj = history.timeline.cases;
          caseValues = Object.values(casesObj) as number[];
          
          if (caseValues.length >= 15) {
              const casesToday = caseValues[caseValues.length - 1];
              const cases7DaysAgo = caseValues[caseValues.length - 8];
              const cases14DaysAgo = caseValues[caseValues.length - 15];
              
              const newCasesThisWeek = Math.max(casesToday - cases7DaysAgo, 0);
              const newCasesLastWeek = Math.max(cases7DaysAgo - cases14DaysAgo, 0);
              
              const incidenceRate = (newCasesThisWeek / pop) * 100000;
              const incidenceNorm = Math.min((incidenceRate / 500) * 10, 10);
              
              let growthFactor = 1;
              if (newCasesLastWeek > 0) {
                  growthFactor = newCasesThisWeek / newCasesLastWeek;
              }
              const growthNorm = growthFactor > 1.2 ? Math.min((growthFactor - 1) * 5, 10) : 0;
              
              livePenalty = Math.round(incidenceNorm + growthNorm);
          }
      }

      const finalScore = Math.min(systemicRisk + endemicRisk + livePenalty, 100);
      const CFR = liveData.cases > 0 ? (liveData.deaths / liveData.cases) : 0;
      const testsPer1M = liveData.testsPerOneMillion || 0;

      return {
        id: iso3,
        name: name,
        score: finalScore,
        fatality: `${(CFR * 100).toFixed(2)}%`,
        testingRate: testsPer1M.toLocaleString(), 
        population: pop,           
        caseHistory: caseValues,   
        trend: finalScore > 75 ? 'Global Emergency' : 'Stable',
        metrics: {
          systemic: systemicRisk,
          endemic: endemicRisk,
          live: livePenalty
        }
      };
    });

    const validCountries = riskData.filter((c: any) => c.id && c.id.length >= 2);
    const sortedRisks = validCountries.sort((a: any, b: any) => b.score - a.score);

    res.json(sortedRisks);

  } catch (error) {
    console.error('Failed to calculate hybrid risk scores:', error);
    res.status(500).json({ error: 'Failed to process algorithmic risk scores.' });
  }
});

app.get('/api/relevant-image', async (req: Request, res: Response) => {
  const query = req.query.query;
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    return res.json({ imageUrl: 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg' });
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: `${query} medical disease`, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: apiKey },
      timeout: 6000,
    });
    const imageUrl = response.data.photos[0]?.src?.large || '';
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch image.' });
  }
});

app.get('/api/outbreak-news', async (req: Request, res: Response) => {
  const limit = req.query.limit || 5;
  const apiKey = process.env.PEXELS_API_KEY;

  try {
    const response = await axios.get('https://www.who.int/api/news/diseaseoutbreaknews', {
      params: { 
        '$top': limit, '$select': 'Id,Title,PublicationDateAndTime,Summary,ItemDefaultUrl', 
        '$orderby': 'PublicationDateAndTime desc', 'sf_culture': 'en' 
      },
      timeout: 12000,
    });

    const newsItems = response.data?.value || [];
    const formattedNews = await Promise.all(newsItems.map(async (i: any) => {
      let imageUrl = 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg'; 
      if (apiKey) {
        try {
          const imageRes = await axios.get('https://api.pexels.com/v1/search', {
            params: { query: `${i.Title} medical`, per_page: 1 },
            headers: { Authorization: apiKey }
          });
          imageUrl = imageRes.data.photos[0]?.src?.large || imageUrl;
        } catch (e) {}
      }
      return {
        id: i.Id, title: i.Title, date: i.PublicationDateAndTime, image: imageUrl,
        summary: i.Summary ? i.Summary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '',
        url: i.ItemDefaultUrl ? `https://www.who.int${i.ItemDefaultUrl}` : 'https://www.who.int/emergencies/disease-outbreak-news',
      };
    }));
    res.json(formattedNews);
  } catch (error) {
    res.status(500).json([]);
  }
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;