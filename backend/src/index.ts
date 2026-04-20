import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GHO_BASE_URL = 'https://ghoapi.azureedge.net/api/';

app.use(cors());
app.use(express.json());


const staticDataPath = path.join(process.cwd(), 'healthiest-countries-2026.json');
let staticHealthData: any[] = [];
try {
  staticHealthData = JSON.parse(fs.readFileSync(staticDataPath, 'utf-8'));
  console.log('✅ Successfully loaded static health index JSON.');
} catch (e) {
  console.warn('⚠️ Could not load healthiest-countries-2026.json. Ensure it is in the root backend folder.');
}

let threatCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ message: 'Health Radar backend is online and tracking.' });
});

app.get('/api/country-stats/:code', async (req: Request, res: Response) => {
  const countryCode = req.params.code;
  try {
    const response = await axios.get(`https://disease.sh/v3/covid-19/countries/${countryCode}?strict=false`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch country stats from upstream provider.' });
  }
});

app.get('/api/historical/:code', async (req: Request, res: Response) => {
  const countryCode = req.params.code;
  try {
   
    const response = await axios.get(`https://disease.sh/v3/covid-19/historical/${countryCode}?lastdays=30`);
    

    res.json(response.data?.timeline?.cases || null);
  } catch (error) {
    // If the country has no historical data, send a graceful 404
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

app.get('/api/global-baseline', async (req: Request, res: Response) => {
  const now = Date.now();
  if (threatCache && now - lastFetchTime < CACHE_DURATION) return res.json(threatCache);

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
        } catch (e) { return { code: ind.code, data: [] }; }
      })
    );

    const results = REGIONS.map((reg) => {
      let totalWeightedScore = 0;
      let activeWeights = 0;

      THREAT_INDICATORS.forEach((ind) => {
        const set = datasetResponses.find((r) => r.code === ind.code);
        const data = set ? set.data : [];
        const regRecords = data.filter((d: any) => d.SpatialDim === reg.code).sort((a: any, b: any) => b.TimeDim - a.TimeDim);

        if (regRecords.length > 0) {
          const rawValue = Number(regRecords[0].NumericValue || regRecords[0].Value || 0);
          const normalized = Math.min((rawValue / ind.ceiling) * 100, 100);
          totalWeightedScore += normalized * ind.weight;
          activeWeights += ind.weight;
        }
      });

      const finalRawValue = activeWeights > 0 ? (totalWeightedScore / activeWeights) * 1.0 : 0;
      const displayValue = finalRawValue > 0 ? Math.max(finalRawValue, 12.5) : 6.0;

      return { SpatialDim: reg.code, NumericValue: parseFloat(displayValue.toFixed(1)) };
    });

    threatCache = results;
    lastFetchTime = now;
    res.json(results);
  } catch (error) { res.json(threatCache || []); }
});

app.get('/api/indicator-status/:country/:code', async (req: Request, res: Response) => {
  const { country, code } = req.params;
  try {
    const response = await axios.get(`${GHO_BASE_URL}${code}?$format=json&$filter=SpatialDim eq '${String(country).toUpperCase()}'&$orderby=TimeDim desc&$top=10`);
    res.json(response.data.value || []);
  } catch (error) { res.status(500).json({ error: `Failed to fetch ${code} for ${country}` }); }
});



app.get('/api/risk-scores', async (req: Request, res: Response) => {
  try {
    
    const staticMap = new Map();
    staticHealthData.forEach(item => {
      if (item.flagCode) staticMap.set(item.flagCode, item);
      if (item.country) staticMap.set(item.country.toLowerCase(), item);
    });

    
    const [diseaseResponse, whoResponse] = await Promise.all([
      axios.get('https://disease.sh/v3/covid-19/countries?strict=false'),
      axios.get(`${GHO_BASE_URL}DIMENSION/COUNTRY/DimensionValues`) 
    ]);

    const diseaseData = diseaseResponse.data;
    const whoCountries = whoResponse.data.value;

   
    const masterRoster = new Map();
    const diseaseMap = new Map();

    
    whoCountries.forEach((c: any) => {
      masterRoster.set(c.Code, { iso3: c.Code, name: c.Title });
    });

   
    diseaseData.forEach((c: any) => {
      if (c.countryInfo && c.countryInfo.iso3) {
        diseaseMap.set(c.countryInfo.iso3, c); // Save live data
        
       
        if (!masterRoster.has(c.countryInfo.iso3)) {
          masterRoster.set(c.countryInfo.iso3, { iso3: c.countryInfo.iso3, name: c.country });
        }
      }
    });

   
    const riskData = Array.from(masterRoster.values()).map((countryObj: any) => {
      const iso3 = countryObj.iso3;
      const name = countryObj.name;

   
      const liveData = diseaseMap.get(iso3) || {};
      const iso2 = liveData.countryInfo?.iso2;

     
      const staticData = staticMap.get(iso2) || staticMap.get(name.toLowerCase()) || {};

 
      const healthIndex = staticData.CEOWorldGlobalHealthIndex_2025 || staticData.GlobalHealthSecurityIndex_2021 || 50;
      const baseRisk = 100 - healthIndex;

    
      const cases = liveData.cases || 1;
      const deaths = liveData.deaths || 0;
      const active = liveData.active || 1;
      const todayCases = liveData.todayCases || 0;

      
      const G = todayCases / active; 
      const velocityPenalty = Math.min((G / 0.05) * 15, 15);

      
      const CFR = deaths / cases;
      const fatalityPenalty = Math.min((CFR / 0.05) * 15, 15);

   
      const finalScore = Math.min(Math.round(baseRisk + velocityPenalty + fatalityPenalty), 100);

      const radarVelocity = Math.min((G / 0.05) * 100, 100); 
      const radarFatality = Math.min((CFR / 0.05) * 100, 100);

      return {
        id: iso3,
        name: name,
        score: finalScore,
        velocity: `${G > 0 ? '+' : ''}${(G * 100).toFixed(3)}%`,
        fatality: `${(CFR * 100).toFixed(2)}%`,
        trend: finalScore > 75 ? 'Global Emergency' : G > 0.01 ? 'High Velocity' : 'Stable',
        metrics: {
          surge: Math.round(radarVelocity),
          fatality: Math.round(radarFatality),
          baseline: Math.round(baseRisk) 
        }
      };
    });


    const validCountries = riskData.filter((c: any) => c.id && c.id.length === 3);
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

  if (!apiKey) return res.status(500).json({ error: 'Pexels API key is missing.' });

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: `${query} medical disease`, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: apiKey },
      timeout: 6000,
    });
    const imageUrl = response.data.photos[0]?.src?.large || '';
    res.json({ imageUrl });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch image from Pexels.' }); }
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
  } catch (error) { res.status(500).json([]); }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;