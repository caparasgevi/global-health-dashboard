import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import countryStatsRouter    from './routes/countryStats.js';
import indicatorStatusRouter from './routes/indicatorStatus.js';
import historicalRouter      from './routes/historical.js';
import indicatorsRouter      from './routes/indicators.js';
import globalBaselineRouter  from './routes/globalBaseline.js';
import riskScoresRouter      from './routes/riskScores.js';
import relevantImageRouter   from './routes/relevantImage.js';
import outbreakNewsRouter    from './routes/outbreakNews.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.send('Health Radar API is Live and Running.'));
app.get('/api/status', (_req, res) =>
  res.json({ message: 'Health Radar backend is online and tracking.' }),
);

app.use('/api/country-stats',     countryStatsRouter);
app.use('/api/indicator-status',  indicatorStatusRouter);
app.use('/api/historical',        historicalRouter);
app.use('/api/indicators',        indicatorsRouter);
app.use('/api/global-baseline',   globalBaselineRouter);
app.use('/api/risk-scores',       riskScoresRouter);
app.use('/api/relevant-image',    relevantImageRouter);
app.use('/api/outbreak-news',     outbreakNewsRouter);

if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`Health Radar API running on port ${PORT}`),
  );
}

export default app;