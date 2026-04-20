import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let cachedIndicators = null;
const verificationCache = new Map(); // Using Map for better performance

const TOP_DISEASES = ['MALARIA_EST_CASES', 'CHOLERA_0000000001', 'WHS3_62', 'MDG_0000000001', 'NTD_DENGUE_CASES', 'RS_196', 'WHS3_41', 'WHS3_42', 'WHS3_40', 'HIV_0000000001'];
const PRIORITY_KWS = ['outbreak', 'epidemic', 'pandemic', 'incidence', 'cholera', 'dengue', 'malaria', 'measles', 'covid', 'sars', 'ebola', 'zika', 'tuberculosis', 'hiv', 'aids', 'hepatitis', 'polio', 'reported cases', 'confirmed cases'];
const BLACKLIST = ['ALCOHOL', 'TOBACCO', 'SMOKING', 'OBESITY', 'FRUIT', 'VEGETABLE', 'EXERCISE', 'PHYSICAL ACTIVITY', 'ROAD TRAFFIC', 'SUICIDE', 'HOMICIDE', 'POISONING', 'AIR POLL pollution', 'SANITATION', 'HYGIENE', 'HEALTH WORKFORCE'];

// 1. Ranked Indicators
app.get('/api/indicators', async (req, res) => {
  try {
    if (cachedIndicators) return res.json(cachedIndicators);
    
    const response = await axios.get('https://ghoapi.azureedge.net/api/Indicator?$format=json', { timeout: 10000 });
    const indicators = response.data?.value || [];

    cachedIndicators = indicators.filter((ind) => {
      if (!ind?.IndicatorName) return false;
      const name = ind.IndicatorName.toUpperCase();
      const code = (ind.IndicatorCode || '').toUpperCase();
      if (BLACKLIST.some(k => name.includes(k) || code.includes(k))) return false;
      return TOP_DISEASES.includes(code) || PRIORITY_KWS.some(k => name.toLowerCase().includes(k.toLowerCase()));
    });
    
    res.json(cachedIndicators.length > 0 ? cachedIndicators : indicators.slice(0, 50));
  } catch (error) {
    res.json([{ IndicatorCode: 'MALARIA_EST_CASES', IndicatorName: 'Malaria Surveillance' }]);
  }
});

// 2. Global Baseline
app.get('/api/global-baseline', async (req, res) => {
  try {
    const response = await axios.get(
      `https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=TimeDim eq 2021 and SpatialDimType eq 'REGION'`,
      { timeout: 8000 }
    );
    res.json(response.data?.value || []);
  } catch (error) {
    res.json([]);
  }
});

// 3. Indicator Status / Verification (FIXED FOR 500 ERRORS)
app.get('/api/indicator-status', async (req, res) => {
  const { code, country } = req.query;
  if (!code || !country) return res.json([]);

  const cacheKey = `${country}_${code}`;
  if (verificationCache.has(cacheKey)) return res.json(verificationCache.get(cacheKey));

  try {
    const response = await axios.get(
      `https://ghoapi.azureedge.net/api/${code}?$format=json&$filter=SpatialDim eq '${country.toUpperCase()}'&$orderby=TimeDim desc&$top=10`,
      { timeout: 10000 }
    );

    const rawValue = response.data?.value || [];
    const processed = rawValue.map((item) => ({
      ...item,
      _safeValue: item.NumericValue != null ? Number(item.NumericValue) : (Number(item.Value) || 0)
    }));

    verificationCache.set(cacheKey, processed);
    res.json(processed);
  } catch (error) {
    res.json([]); 
  }
});

// 4. Country Stats (Disease.sh)
app.get('/api/stats/:code', async (req, res) => {
  try {
    const response = await axios.get(`https://disease.sh/v3/covid-19/countries/${req.params.code}?strict=false`, { timeout: 5000 });
    res.json(response.data);
  } catch { 
    res.status(200).json(null); 
  }
});

// 5. Images
app.get('/api/image', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await axios.get(`https://api.pexels.com/v1/search`, {
      params: { query: `${query} medical disease`, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: process.env.PEXELS_API_KEY },
      timeout: 5000
    });
    res.json({ url: response.data.photos[0]?.src?.large || '' });
  } catch { 
    res.json({ url: '' }); 
  }
});

// 6. News (WHO) + Serialized Pexels Logic (FIXED FOR RATE LIMITS)
app.get('/api/news', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const response = await axios.get(`https://www.who.int/api/news/diseaseoutbreaknews`, {
      params: { '$top': limit, '$orderby': 'PublicationDateAndTime desc', 'sf_culture': 'en' },
      timeout: 10000
    });

    const rawNews = response.data?.value || [];

    const newsWithImages = [];
    for (const item of rawNews) {
      let newsImage = 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg';
      
      try {
        const pexelsRes = await axios.get(`https://api.pexels.com/v1/search`, {
          params: { query: `${item.Title.split(' ').slice(0, 3).join(' ')} virus`, per_page: 1 },
          headers: { Authorization: process.env.PEXELS_API_KEY },
          timeout: 3000
        });
        if (pexelsRes.data.photos?.[0]?.src?.large) {
          newsImage = pexelsRes.data.photos[0].src.large;
        }
      } catch (err) {
      }

      newsWithImages.push({
        id: item.Id,
        title: item.Title,
        date: item.PublicationDateAndTime,
        summary: item.Summary || '',
        url: item.ItemDefaultUrl ? `https://www.who.int${item.ItemDefaultUrl}` : '',
        image: newsImage
      });
    }

    res.json(newsWithImages);
  } catch (error) {
    res.json([]);
  }
});

app.listen(PORT, () => console.log(`Health Dashboard Server running on port ${PORT}`));