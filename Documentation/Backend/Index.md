# 🛡️ Health Radar Backend 
## Infrastructure & Intelligence Layer

## Introduction
The **Health Radar API** is a high-performance middleware intelligence layer built with **Express.js** and **TypeScript**. It serves as the primary data engine for the Health Radar platform, aggregating disparate data streams from the World Health Organization (WHO), epidemiological databases, and static health indices into a unified, actionable **Global Risk Score**.

Designed for serverless deployment on **Vercel**, the backend prioritizes data normalization, real-time threat calculation, and intelligent caching to provide a live snapshot of global health safety.

---

## System Architecture
The backend operates as an **Aggregator & Processor**:
1.  **Static Data Layer:** Uses a specialized JSON import fix to bundle 2025/2026 health indices directly into the deployment.
2.  **Live Aggregation:** Fetches real-time epidemiological data via **Disease.sh** and indicator data via the **WHO GHO API**.
3.  **Algorithmic Engine:** Executes a multi-stage hybrid risk calculation to generate the 0–100 Risk Score.
4.  **Visual Enrichment:** Integrates the **Pexels API** to contextually map medical imagery to news and data points.

---

## 🧬 The Hybrid Risk Algorithm
The core of the system is the `/api/risk-scores` endpoint, which translates raw metrics into a standardized risk profile.

### Calculation Pillars
| Category | Weight | Description |
| :--- | :--- | :--- |
| **Systemic Risk** | **70%** | Derived from the CEOWorld Global Health Index or GHS Index (100 - Index). |
| **Endemic Risk** | **30%** | Represents the baseline vulnerability of the local health ecosystem. |
| **Live Penalty** | **Variable** | A dynamic "spike" added based on 7-day incidence rates and case growth factors. |

### The Mathematical Formula
The final score uses a ceiling function to maintain a consistent 0–100 scale:

$$Final Score = \min((Systemic + Endemic + LivePenalty), 100)$$

**Live Penalty Breakdown:**
* **Incidence Norm:** Up to +10 points based on cases per 100k population.
* **Growth Norm:** Up to +10 points if the current week's cases exceed the previous week by a factor > 1.2.

---

## 📡 API Endpoints

### Surveillance & Intelligence
* `GET /api/risk-scores`: The primary engine. Merges static health indices with live COVID-19 history to return a sorted list of global risks.
* `GET /api/global-baseline`: Fetches regional threat levels (Malaria, Cholera, etc.) from the WHO GHO API. Implements a **60-minute server-side cache**.
* `GET /api/outbreak-news`: Scrapes WHO Disease Outbreak News, sanitizes HTML summaries, and fetches related medical imagery via Pexels.

### Regional Deep-Dives
* `GET /api/country-stats/:code`: Returns specific live stats (cases, deaths, tests) for a specific ISO code.
* `GET /api/historical/:code`: Returns 30-day case timelines for trend visualization.
* `GET /api/indicator-status/:country/:code`: Queries the WHO API for specific health indicators (e.g., vaccine coverage) for a target nation.

---

## 🛠 Technical Stack
* **Runtime:** Node.js (TypeScript)
* **Framework:** Express.js
* **External APIs:**
    * **WHO GHO:** Global Health Observatory for regional baseline metrics.
    * **Disease.sh:** Real-time epidemiological and population statistics.
    * **Pexels:** Dynamic medical/health visual content.
* **Deployment:** Optimized for Vercel Serverless Functions.

---

## ⚙️ Key Technical Features

### Vercel Deployment Optimization
The backend utilizes **Import Attributes** to ensure the bundler includes static JSON health data in the serverless environment:
```typescript
import staticHealthDataRaw from '../healthiest-countries-2026.json' with { type: 'json' };
```

### Resiliency & Performance
* **Aggressive Caching:** Regional baselines are cached to stay within WHO API rate limits and improve response times.
* **Fallback Logic:** If live APIs fail, the system falls back to the static 2026 Health Index to ensure the Global Map remains functional.
* **Network Timeouts:** Implements strict timeouts (6s–12s) on external requests to prevent serverless function hanging.
