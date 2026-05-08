import { Router, Request, Response } from 'express';
import { http } from '../lib/httpClient.js';
import * as cache from '../lib/cache.js';

const router = Router();
const TTL = 30 * 60 * 1000; 

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg';
const WHO_NEWS_URL = 'https://www.who.int/api/news/diseaseoutbreaknews';

async function fetchPexelsImage(query: string, apiKey: string): Promise<string> {
  try {
    const { data } = await http.get('https://api.pexels.com/v1/search', {
      params: { query: `${query} medical`, per_page: 1 },
      headers: { Authorization: apiKey },
      timeout: 6_000,
    });
    return data.photos[0]?.src?.large ?? FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

router.get('/', async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 5;
  const key = `outbreak-news:${limit}`;

  const cached = cache.get<unknown[]>(key);
  if (cached) return res.json(cached);

  try {
    const { data } = await http.get(WHO_NEWS_URL, {
      params: {
        $top: limit,
        $select: 'Id,Title,PublicationDateAndTime,Summary,ItemDefaultUrl',
        $orderby: 'PublicationDateAndTime desc',
        sf_culture: 'en',
      },
      timeout: 12_000,
    });

    const apiKey = process.env.PEXELS_API_KEY ?? '';
    const newsItems: any[] = data?.value ?? [];

    const formatted = await Promise.all(
      newsItems.map(async (item) => {
        const imageUrl = apiKey
          ? await fetchPexelsImage(item.Title, apiKey)
          : FALLBACK_IMAGE;

        return {
          id: item.Id,
          title: item.Title,
          date: item.PublicationDateAndTime,
          image: imageUrl,
          summary: item.Summary ? stripHtml(item.Summary) : '',
          url: item.ItemDefaultUrl
            ? `https://www.who.int${item.ItemDefaultUrl}`
            : 'https://www.who.int/emergencies/disease-outbreak-news',
        };
      }),
    );

    cache.set(key, formatted, TTL);
    res.json(formatted);
  } catch {
    res.status(500).json([]);
  }
});

export default router;