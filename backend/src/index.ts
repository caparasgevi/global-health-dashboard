import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
// Render assigns a random port; this line ensures we use it.
const PORT = Number(process.env.PORT) || 5000;
const GHO_BASE_URL = 'https://ghoapi.azureedge.net/api/';

app.use(cors());
app.use(express.json());

// Root Route - Crucial for Render's Health Check
app.get('/', (req, res) => {
  res.send('Health Radar API is Live and Running.');
});

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ message: 'Health Radar backend is online and tracking.' });
});

app.get('/api/country-stats/:code', async (req: Request, res: Response) => {
  const countryCode = req.params.code;
  try {
    const response = await axios.get(
      `https://disease.sh/v3/covid-19/countries/${countryCode}?strict=false`
    );
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

app.get('/api/indicators', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${GHO_BASE_URL}Indicator?$format=json`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch WHO indicators.' });
  }
});

// Global baseline logic with local caching
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
          const res = await axios.get(
            `${GHO_BASE_URL}${ind.code}?$format=json&$filter=SpatialDimType eq 'REGION'`,
            { timeout: 8000 }
          );
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

      return {
        SpatialDim: reg.code,
        NumericValue: parseFloat(displayValue.toFixed(1)),
      };
    });

    threatCache = results;
    lastFetchTime = now;
    res.json(results);
  } catch (error) {
    res.json(threatCache || []);
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
        '$top': limit,
        '$select': 'Id,Title,PublicationDateAndTime,Summary,ItemDefaultUrl',
        '$orderby': 'PublicationDateAndTime desc',
        'sf_culture': 'en'
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
        } catch (e) {
          console.warn(`Pexels fetch failed for: ${i.Title}`);
        }
      }

      return {
        id: i.Id,
        title: i.Title,
        date: i.PublicationDateAndTime,
        image: imageUrl,
        summary: i.Summary ? i.Summary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '',
        url: i.ItemDefaultUrl ? `https://www.who.int${i.ItemDefaultUrl}` : 'https://www.who.int/emergencies/disease-outbreak-news',
      };
    }));

    res.json(formattedNews);
  } catch (error) {
    res.status(500).json([]);
  }
});

// Final Fix: Listen on 0.0.0.0 regardless of environment
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;