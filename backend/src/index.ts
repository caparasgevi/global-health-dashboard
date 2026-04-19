import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json());

// Basic Test Route
app.get('/api/status', (req: Request, res: Response) => {
  res.json({ message: 'Health Radar backend is online and tracking.' });
});

// Proxy Route for Disease.sh Country Stats
app.get('/api/country-stats/:code', async (req: Request, res: Response) => {
  const countryCode = req.params.code;

  try {
    const response = await axios.get(`https://disease.sh/v3/covid-19/countries/${countryCode}?strict=false`);
    res.json(response.data);
  } catch (error) {
    console.error(`Failed to fetch stats for ${countryCode}`);
    res.status(500).json({ error: 'Failed to fetch country stats from upstream provider.' });
  }
});



//  Ranked Indicators
app.get('/api/indicators', async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://ghoapi.azureedge.net/api/Indicator?$format=json');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch WHO indicators.' });
  }
});

//  Global Baseline
app.get('/api/global-baseline', async (req: Request, res: Response) => {
  try {
    const response = await axios.get("https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=TimeDim eq 2021 and SpatialDimType eq 'REGION'");
    res.json(response.data.value || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global baseline.' });
  }
});

//   Get Specific Indicator Status for a Country
app.get('/api/indicator-status/:country/:code', async (req: Request, res: Response) => {
  const { country, code } = req.params;
  try {
    const response = await axios.get(`https://ghoapi.azureedge.net/api/${code}?$format=json&$filter=SpatialDim eq '${String(country).toUpperCase()}'&$orderby=TimeDim desc&$top=10`);
    res.json(response.data.value || []);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch ${code} for ${country}` });
  }
});


// PEXELS 

app.get('/api/relevant-image', async (req: Request, res: Response) => {
  const query = req.query.query;
  
  if (!process.env.PEXELS_API_KEY) {
    return res.status(500).json({ error: 'Pexels API key is missing on the server.' });
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: `${query} medical disease`, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });
    
    // Extract just the image URL and send it back
    const imageUrl = response.data.photos[0]?.src?.large || '';
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch image from Pexels.' });
  }
});


// OUTBREAK NEWS 

app.get('/api/outbreak-news', async (req: Request, res: Response) => {
  const limit = req.query.limit || 5;
  try {
    const response = await axios.get('https://www.who.int/api/news/diseaseoutbreaknews', {
      params: {
        '$top': limit,
        '$select': 'Id,Title,PublicationDateAndTime,Summary,ItemDefaultUrl',
        '$orderby': 'PublicationDateAndTime desc',
        'sf_culture': 'en'
      }
    });
    
    // Format the data exactly how the frontend expects it
    const formattedNews = (response.data?.value || []).map((i: any) => ({
      id: i.Id,
      title: i.Title,
      date: i.PublicationDateAndTime,
      summary: i.Summary || '',
      url: i.ItemDefaultUrl ? `https://www.who.int${i.ItemDefaultUrl}` : ''
    }));
    
    res.json(formattedNews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch outbreak news.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});