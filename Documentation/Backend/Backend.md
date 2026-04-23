# 🛡️ Health Radar Backend 

## Infrastructure & Intelligence Layer

---

## Introduction

The **Health Radar Backend** is a hybrid system consisting of a **Supabase (PostgreSQL)** data persistence layer and a **Node.js/Express** intelligence middleware. It is designed to act as a real-time aggregator that transforms raw global health data into actionable "Risk Scores" for the frontend Global Map.

By combining static health indices with live outbreak data from the WHO and Disease.sh, the backend provides a predictive and current view of global health safety.

---

## System Architecture

The backend operates as a **Middleware Intelligence Layer**:
1.  **Persistence (Supabase):** Stores user profiles, static country indices, and cached historical trends.
2.  **Aggregation (Express API):** Fetches real-time data from external providers (WHO GHO API, Disease.sh).
3.  **Processing:** Executes the **Hybrid Risk Algorithm** to normalize diverse data points into a 0-100 score.
4.  **Enrichment:** Uses the **Pexels API** to attach relevant medical imagery to live outbreak news.

---

# The Risk Score Algorithm

## Purpose
The core logic that powers the Global Map visualization. It converts raw case numbers into a single **Safety/Risk Score (0–100)**.

## Calculation Pillars
The score is a weighted sum of three distinct data categories:

| Category | Weight | Description |
| :--- | :--- | :--- |
| **Systemic Risk** | 70% | Infrastructure readiness based on Global Health Security & CEOWorld indices. |
| **Endemic Risk** | 30% | Baseline population vulnerability and vulnerability to local diseases. |
| **Live Penalty** | Dynamic | A temporary "spike" added based on 14-day case growth and weekly incidence rates. |

### The Formula
The final value is capped at 100 to ensure scale consistency:
$$Final Score = \min((Systemic + Endemic + Live Penalty), 100)$$

---

# Database Schema (PostgreSQL)

## Core Tables (Supabase)

### 1. `countries`
* **Purpose:** Registry for all monitored nations.
* **Fields:** `id` (UUID), `name` (Text), `iso_code` (ISO-2/3), `region` (Text).

### 2. `health_stats`
* **Purpose:** Stores calculated risk scores and current metrics.
* **Fields:** `country_id` (FK), `active_cases` (Int), `risk_score` (Int), `fatality_rate` (Float).

---

# API Endpoints (Express.js)

## Surveillance Endpoints

### `GET /api/risk-scores`
* **Returns:** A sorted list of all countries, their calculated scores, and 30-day case history.
* **Logic:** Merges static JSON index data with live results from `disease.sh`.

### `GET /api/global-baseline`
* **Returns:** Regional threat levels (e.g., Africa, SE Asia).
* **Source:** WHO GHO API.
* **Caching:** Implements a 60-minute server-side cache to manage API rate limits.

### `GET /api/outbreak-news`
* **Returns:** Latest headlines from WHO Disease Outbreak News (DONs).
* **Processing:** Automatically strips HTML tags and attaches medical imagery via Pexels.

## Country Details

### `GET /api/country-stats/:code`
* **Purpose:** Detailed COVID-19/Population data for the Full Report page.

### `GET /api/historical/:code`
* **Purpose:** Last 30 days of case data for trend visualization.

---

# Technical Stack

* **Framework:** Node.js / TypeScript.
* **Backend Platform:** Supabase (PostgreSQL + Auth).
* **API Framework:** Express.js.
* **External APIs:** * WHO Global Health Observatory (GHO)
    * Disease.sh (Open Disease Data)
    * Pexels API (Visual content)
* **Deployment:** Optimized for Vercel / Serverless environments.

---

# Security & Performance

* **Row Level Security (RLS):** Policies in Supabase ensure only admins can modify baseline health indices.
* **Caching Layer:** Regional threat data is cached in memory to reduce latency and external API dependency.
* **Resiliency:** Implements 10-second timeouts on external WHO requests to prevent backend hanging.
