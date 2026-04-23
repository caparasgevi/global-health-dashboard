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

# 🗄️ Database Documentation

## Data Source Strategy
The system follows a **Split-Data Architecture**:
* **Static Layer (JSON):** Contains the *CEOWorld Global Health Index 2025* and *GHS Index 2021*. This is bundled with the backend to ensure zero-latency access to baseline safety metrics.
* **Persistence Layer (Supabase/PostgreSQL):** Manages relational data, user-specific configurations, and cached indicators that require persistence across sessions.

---

## 1. Static Schema (`healthiest-countries-2026.json`)
This file acts as the primary lookup table for the risk-scoring algorithm when calculating systemic vulnerability.

| Key | Type | Description |
| :--- | :--- | :--- |
| `country` | `string` | The common name of the nation. |
| `flagCode` | `string` | ISO Alpha-2 or Alpha-3 code used for API mapping. |
| `CEOWorldGlobalHealthIndex_2025` | `number` | Infrastructure-based health score (0–100). |
| `GlobalHealthSecurityIndex_2021` | `number` | Preparedness-based health score (0–100). |

---

## 2. PostgreSQL Schema (Supabase)
The relational database handles dynamic entities and allows the system to scale beyond stateless API calls.

### Table: `countries`
Acts as the **Master Registry** for mapping different data sources (WHO, Disease.sh, Pexels).
* `id`: `uuid` (Primary Key)
* `name`: `text` (Official name)
* `iso_alpha2`: `varchar(2)` (Used for Pexels and Flag icons)
* `iso_alpha3`: `varchar(3)` (Used for WHO GHO and Disease.sh)
* `region_id`: `fk` (Reference to `regions.id`)

### Table: `health_indices`
Stores snapshots of calculated risks to allow for "Trend Analysis" (e.g., *Is the risk in France increasing or decreasing?*).
* `id`: `bigint` (Primary Key)
* `country_id`: `fk` (Reference to `countries.id`)
* `systemic_score`: `float` (The 70% component)
* `live_penalty`: `float` (The dynamic spike component)
* `final_risk_score`: `int` (The 0–100 result)
* `recorded_at`: `timestamp` (Defaults to `now()`)

### Table: `user_alerts` (Planned)
Allows users to subscribe to specific country risk changes.
* `user_id`: `uuid` (Reference to Supabase Auth)
* `country_id`: `fk`
* `threshold`: `int` (Alert when score > X)

---

## 3. Data Integration Flow
The backend merges these database sources in real-time during the `/api/risk-scores` request:

1.  **Initialize:** The server loads the **Static JSON** into a `Map` for O(1) lookup.
2.  **Fetch:** The server pulls live case data from **Disease.sh**.
3.  **Cross-Reference:** The `iso_alpha3` from the API is matched against the `flagCode` in the JSON and the `iso_code` in **Supabase**.
4.  **Normalize:** The logic calculates the final score and can optionally log this result back to the `health_indices` table in Supabase for historical tracking.

---

## 🔐 Security & Access Control
* **Row Level Security (RLS):** All tables in Supabase have RLS enabled. 
    * *Public:* Can `SELECT` from `countries` and `health_indices`.
    * *Authenticated:* Can `INSERT/UPDATE` their own `user_alerts`.
    * *Service Role:* Only the Express Backend (Intelligence Layer) has `bypass` RLS to update global health statistics via the `SUPABASE_SERVICE_ROLE_KEY`.

---

This structure ensures that even if an external API (like WHO) experiences a 10-second timeout, the system can still serve baseline data from the **Static Layer** and recent trends from the **Supabase Layer**.

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


# 🛡️ Health Radar Frontend
## Public & Private Pages

---

## Introduction

**Health Radar** is a sophisticated global health surveillance platform designed to monitor, visualize, and alert users to emerging health risks and disease outbreaks. By integrating real-time data from global health organizations and localized reports, the platform provides actionable intelligence to public health officials, researchers, and the general public.

Health Radar addresses reporting lag by providing a unified, real-time **"Global Map"** of localized risks, allowing for faster response times and better-informed health safety decisions through a data-driven interface.

---

## User Journey Overview

1.  **Entry Point:** User lands on the **Auth (Sign In/Log In) Page**. This is the mandatory gatekeeper for the platform.
2.  **Authentication:** User chooses to **Sign In** (existing account), **Sign Up** (new account), or **Enter as Guest**.
3.  **Command Center:** Upon successful auth, the user is directed to the **Home Page**, which acts as a single-page scrolling dashboard.
4.  **Surveillance & Exploration:** User explores the Global Map, checks specific Country Statistics, views Risk Scores, and analyzes Trends.
5.  **Deep Dive:** User searches for specific illnesses or countries to generate a **Full Report**.

---

# Authentication Page (Entry)

## Purpose
The primary landing area where access is managed. No protected health data is visible until the user is authenticated or enters as a guest.

## UI Elements
* **Sign In / Sign Up Toggles:** Switch between creating an account or logging in.
* **Guest Access Button:** Allows immediate entry with limited persistence.
* **Supabase Auth Integration:** Secure handling of user credentials.
* **Brand Visuals:** Clean, high-impact medical surveillance branding to establish trust.

## User Flow
1. User arrives at `/auth`.
2. User selects entry method (Login, Register, or Guest).
3. System validates credentials via Supabase.
4. User is redirected to the main dashboard (`/`).

---

# Home Dashboard (Main View)

## Purpose
A comprehensive, single-page scrollable interface that summarizes the global health landscape.

## UI Components (Ordered Stack)
1.  **Home (Hero):** Initial visual summary and welcome message.
2.  **About:** Transparent overview of the website's purpose and data methodology.
3.  **Global Map:** Interactive, color-coded geospatial visualization of risks (supports Light/Dark themes).
4.  **Country Statistics:** Data-rich section featuring graphs and localized metrics.
5.  **Trends:** Historical data visualizations showing outbreak progression.
6.  **Risk Scores:** Comparative analysis of safety levels across different regions.
7.  **Our Team:** Project contributors and contact information.

## User Flow
1. User scrolls through the stacked components to get a holistic view.
2. User interacts with the **Global Map** to identify hotspots.
3. User utilizes the **Search Bar** in the Header to look for specific outbreaks.
4. User clicks specific data points to navigate to the **Full Report** page.

## UX & Design Notes
* **Dual Theme Support:** Fully responsive **Light and Dark modes** toggled via the Header.
* **Smooth Motion:** Uses `framer-motion` for fluid page transitions and component entries.
* **Persistence:** Theme preferences and session status are stored in `localStorage`.

---

# Full Report Page

## Purpose
A dedicated route (`/full-report`) for granular, in-depth analysis of a specific country or health event.

## UI Elements
* **Detailed Outbreak Info:** Comprehensive text and data on specific illnesses.
* **Extended Charts:** Granular statistical breakdowns.
* **Data Export:** Options to download or share the specific findings.

---

# Navigation & Global Components

## Header
* **Auth Status:** Displays current user info or "Guest" status.
* **Theme Toggle:** Switch between Light/Dark mode.
* **Search Functionality:** Global search for countries or illness info.
* **Logout Button:** Securely ends Supabase session.

## Footer
* Visible to all authenticated/guest users.
* Contains legal disclaimers, data sources citations, and secondary links.

## Technical Manager (ResetManager)
* **Session Cleanup:** Automatically clears `sessionStorage` (queries and country data) on hard browser reloads.
* **Route Protection:** Automatically redirects users to the Home Dashboard if they attempt to access invalid nested routes.
* **Scroll Restoration:** Resets scroll position to the top (0,0) on navigation for a fresh UX.

---

# Technical Stack

* **Framework:** React with TypeScript.
* **Routing:** React Router DOM (v6).
* **Backend/Auth:** Supabase (PostgreSQL + Auth).
* **Animations:** Framer Motion (LazyMotion for performance).
* **Styling:** Tailwind CSS with Dark Mode support.
* **Performance:** Navigation timing checks to prevent stale data on reloads.

---

# Performance & Accessibility

* **Responsive Design:** Optimized for desktop surveillance centers and mobile field use.
* **Lazy Loading:** `AnimatePresence` and `LazyMotion` ensure the heavy mapping components do not block the initial UI render.
* **Theme Consistency:** Transition durations (500ms) applied to background colors for a premium feel.

# 🖥️ APP - Frontend Documentation

## 1. Application Architecture
The frontend is a **Single Page Application (SPA)** built with **React** and **TypeScript**, utilizing a component-based architecture for modularity.

* **Routing:** Managed via `react-router-dom` with a "protected route" logic that gates access to health data.
* **Animations:** Powered by `framer-motion` (Lazy-loaded via `LazyMotion` to optimize initial bundle size).
* **Theming:** Implements a Tailwind-based dark/light mode toggle with persistence in `localStorage`.

---

## 2. Authentication Strategy
The system implements a **Hybrid Auth Guard** to provide flexibility for different user types:

### A. Supabase Integration
The app subscribes to `onAuthStateChange`. If a valid session exists, the user's Supabase profile is injected into the global `user` state.

### B. "Guest Mode" Implementation
To lower the barrier to entry, the app supports a local `guest` state:
* Users can opt-out of full registration while still accessing the dashboard.
* This is persisted via `localStorage.getItem("auth_mode")`.
* **The Fix:** Upon login/guest entry, the app performs a hard redirect (`window.location.href`) to ensure all background scripts and state are cleanly initialized for the new session.

---

## 3. Navigation & Lifecycle Management
The `ResetManager` component is a specialized utility designed to keep the data experience fresh:

* **Session Cleanup:** On a manual browser reload, specific session data (`health_radar_query`, `health_radar_country`) is purged to prevent "stale" search results.
* **Scroll Restoration:** Set to `manual` to ensure users aren't jumped to random scroll positions during navigation.
* **Path Allow-List:** Redirects any unauthorized or broken URLs (404s) back to the `/home` dashboard.

---

## 4. Route Mapping
The application uses a nested layout within the `/home` route to create a seamless scrolling dashboard experience.

| Route | Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/auth` | `AuthWrapper` | Public | Login, Sign up, and Guest entrance. |
| `/home` | `Multi-Section` | **Protected** | The main dashboard (Home, Map, Stats, Trends, Team). |
| `/full-report` | `FullReport` | **Protected** | Detailed analytical breakdown for specific countries. |
| `/update-password`| `UpdatePassword`| Public/Auth | Security management for registered users. |

---

## 5. Global State & Context
The root `App` component holds several critical state variables passed down to children:

* **`isDark`**: Boolean controlling the `dark` class on the `<html>` element.
* **`authStatus`**: Derived state (`user` | `guest` | `unauthenticated`).
* **`isLoading`**: Gating state that prevents "flicker" while Supabase checks the current session on mount.

---

## 🛠 Technical Highlights
* **Navigation Optimization:** Uses `PerformanceNavigationTiming` to distinguish between a "link click" and a "page reload," allowing for smart data purging.
* **Dynamic Theme Injection:** Listens for changes to `isDark` and instantly updates the document's class list and `localStorage` to ensure a persistent visual experience across sessions.
* **Secure Redirects:** The `Maps` component from `react-router-dom` is used to programmatically shield sensitive data routes from unauthenticated traffic.

# 🖥️ PAGES - Frontend Documentation

## Overview
The **Health Radar** frontend is a high-performance Single Page Application (SPA) built with React. It heavily utilizes `framer-motion` for fluid page transitions, `recharts` for complex data visualizations, and custom hooks for efficient API interactions with the backend intelligence layer.

---

## 🏗️ Application Root

### `App.tsx` (The Command Center)
* **Purpose:** The root component that orchestrates routing, global state (authentication and theme), and navigation security.
* **Under the Hood / Code Mechanics:**
  * **Authentication State:** Uses Supabase's `onAuthStateChange` to listen for real-time session updates. It also handles a custom "Guest Mode" fallback via `localStorage`, ensuring users can explore the app without forcing a hard signup.
  * **Routing & Security:** Wraps the app in `react-router-dom`. Unauthenticated users attempting to access `/home` or `/full-report` are automatically redirected to `/auth` using the `<Navigate>` component.
  * **Reset Manager:** A custom utility component that detects browser reloads (`PerformanceNavigationTiming`) and explicitly wipes stale `sessionStorage` search queries, ensuring the user gets fresh data.
  * **Theming:** Manages the global `isDark` state, injecting the `dark` class into the HTML root for Tailwind to process.

---

## 🌍 Surveillance & Mapping

### `GlobalMap.tsx`
* **Purpose:** The interactive visual centerpiece of the platform, allowing users to select nodes (countries) to view localized health intelligence.
* **Data Flow:**
  * Fetches geographical coordinates globally via `disease.sh`.
  * Upon selecting a country, it triggers `fetchSpecificRisks()`, calling the backend for **Disease Outbreak News (DONs)** and **WHO Indicators**, filtering for acute threats (e.g., Malaria, Dengue).
* **Technical Highlights:** Implements a custom map ref (`flyTo`) for smooth geographic transitions and a debounced, auto-filtering search bar overlaid on the map UI.
* **Under the Hood / Code Mechanics:**
  * **Initialization:** On mount, it maps over the `/countries` endpoint from `disease.sh` to extract `lat`, `long`, and `iso3` codes, pushing them into the `outbreaks` state array to plot the map markers.
  * **Data Aggregation:** Uses a multi-promise approach (`Promise.all`) to simultaneously fetch DON alerts, real-time COVID stats, and WHO indicators for the clicked country to populate the side panel.
  * **Data Parsing:** It filters out old data (`parseInt(stats[0].TimeDim) < 2021`) and uses an `ACUTE_KEYWORDS` array to tag diseases as "Acute" (red UI) or "Chronic" (grey UI).

---

## 📊 Analytics & Intelligence

### `RiskScores.tsx` (The Time Machine)
* **Purpose:** A dynamic leaderboard displaying the calculated Risk Scores (0–100) for all tracked nations, complete with a detailed drill-down view.
* **Data Flow:** Fetches the baseline array from `/api/risk-scores` and deep-dives into historical timelines (`healthService.getHistoricalData`).
* **Technical Highlights:** * **Time Machine Algorithm:** Features an interactive slider (`timeOffset`) that allows users to rewind up to 14 days. 
  * **Visuals:** Uses `Recharts` (AreaChart) with custom gradient definitions to visualize outbreak acceleration.
* **Under the Hood / Code Mechanics:**
  * **Client-Side Recalculation:** The `filteredLeaderboard` utilizes `useMemo` to recalculate incidence rates, growth factors, and the final 0-100 score purely on the frontend based on the slider position, preventing unnecessary backend API calls.
  * **Stable Sorting:** It sorts the full array to determine the true `globalRank`, and *then* applies the `searchQuery` filter. This ensures a country keeps its correct rank number (e.g., #14) even if it's the only item currently in the search results.

### `Trends.tsx`
* **Purpose:** Deep-dive analytical views comparing disease trajectories (e.g., current year vs. previous baseline).
* **Data Flow:** Utilizes a highly optimized "Disease Discovery" protocol. It checks batches of WHO indicators against a specific country to find active data points.
* **Under the Hood / Code Mechanics:**
  * **Session Persistence:** The `searchQuery` and `activeCountry` states are initialized from `sessionStorage`. An effect updates `sessionStorage` whenever they change, preserving context across navigations.
  * **Data Speed Calculation:** In `DiseaseChangeIndex`, it grabs the two most recent years of WHO data. It calculates the percentage change: `((currentVal - prevVal) / prevVal) * 100` to populate the `BarChart`, turning the bar red if the speed is > 0 (surge).
  * **Fallback Component:** If no country is selected, it renders `<DefaultHealthDashboard/>` which calculates regional life expectancy averages compared to a `globalAvg`.

### `FullReport.tsx`
* **Purpose:** A comprehensive historical analysis of active diseases for a selected country.
* **Technical Highlights:**
  * **Lazy Loading & Suspense:** Heavy chart components (`TrendChart`, `ComparisonChart`) are lazy-loaded to prevent blocking the initial page render.
  * **Infinite Scrolling:** Uses an `IntersectionObserver` (`lastElementRef`) to progressively load and render charts only when they enter the viewport, saving immense memory and API quota.
* **Under the Hood / Code Mechanics:**
  * **Disease Discovery (`useDiseaseDiscovery`):** Batches WHO indicators into chunks (using a `for` loop and `Promise.all`). It checks if a country has data for a disease, using a `Set` (`usedRoots`) to prevent duplicate disease types (e.g., stopping multiple "Malaria" indicators from clogging the UI). It aborts once it hits `TARGET_MIN`.

### `CountryStatistics.tsx`
* **Purpose:** A focused "Health System Audit" view for a specific nation.
* **Data Flow:** Blends static seed-based generation (for UI layout demonstration of Critical Care/Lab Capacity) with live COVID-19 data.
* **Technical Highlights:**
  * **Instant Search:** Pre-fetches the `restcountries` API on mount, allowing sub-millisecond local filtering for the country search dropdown.
  * **CSV Export:** Includes a functional `handleDownload` utility that generates and downloads a `.csv` report of the country's resource matrix directly from the browser.
* **Under the Hood / Code Mechanics:**
  * **Deterministic Data (`useMemo`):** The `resourceData` array isn't fetched from an API. Instead, it converts the country's ISO code into a number (`seedValue = code.split('').reduce...`) and uses modulo math to generate consistent, pseudo-random "Availability" and "Risk" percentages.

---

## 🏠 Core Navigation & Content

### `Home.tsx`
* **Purpose:** The primary landing dashboard combining global baselines with breaking news.
* **Component Composition:**
  * **WHO Surveillance Archive:** Utilizes `Swiper.js` to create an auto-playing carousel of sanitized Disease Outbreak News, complete with contextual search links.
  * **Regional Threat Level:** Renders the cached `/api/global-baseline` data using animated `framer-motion` progress bars (`Counter` component) to represent regional systemic risks.
* **Under the Hood / Code Mechanics:**
  * **Slider Integration:** The `useEffect` hook pauses the autoplay when `isExpanded` is true (when a user expands a news caption) and resumes it when closed.
  * **Data Processing:** `fetchRegionalData` maps cryptic WHO region codes (AFR, AMR) to readable strings, calculating the `threatLevel` and assigning a status ("Critical", "High", etc.) based on the numeric value.
  * **Animated Counters:** The custom `<Counter>` component uses Framer Motion's `useMotionValue` and `useTransform`. When `useInView` detects the number is on screen, it animates from 0 to the target value.

### `About.tsx`
* **Purpose:** Informational page detailing the platform's methodology and data pipelines.
* **Under the Hood / Code Mechanics:**
  * **Core Logic:** Uses a `setInterval` hook that runs every 4 seconds to increment the `activeStep` state `(prev + 1) % 4`. This drives the auto-advancing "Pipeline Architecture" timeline UI.
  * **State Management:** `selectedValue` tracks which "Core Value" button the user clicked. When not `null`, an `<AnimatePresence>` modal mounts to display the dictionary definition.

### `OurTeam.tsx`
* **Purpose:** Informational page detailing the engineering team behind the application.
* **Technical Highlights:** Heavy use of `AnimatePresence` and staggered `framer-motion` variants. Features an interactive "Reveal" mechanic, transitioning from a blurred group photo into an interactive, hover-responsive grid of individual profiles.
* **Under the Hood / Code Mechanics:**
  * **Interaction State:** Uses `isRevealed` to switch between the blurred "preview" image and the actual team grid. `selectedMember` tracks which card is currently clicked/active.
  * **Animation Array:** Maps over the `teamMembers` array, giving each card a `transition={{ delay: member.id * 0.1 }}` to create a staggered "waterfall" entry effect.

---

## 🔐 Security & Access

### `Auth.tsx`
* **Purpose:** Handles user entry, registration, and guest access.
* **Technical Highlights:** * **Hybrid Access:** Supports standard Supabase email/password authentication alongside an integrated "Guest Mode" (`localStorage.getItem("auth_mode")`), ensuring high conversion rates while protecting sensitive routes.
  * **Form Management:** Features controlled inputs with real-time validation, dynamic error/success banners, and an integrated `iso-3166-1` searchable dropdown to accurately bind a user to a specific country profile.
* **Under the Hood / Code Mechanics:**
  * **State Management:** Bundles form inputs into a single `formData` object. `isLogin`, `isConfirming`, and `isForgotPassword` act as flags to switch the UI views dynamically.
  * **Supabase Logic:** `handleSubmit` intercepts the form and fires `signInWithPassword`, `signUp` (passing metadata like country and alerts), or `resetPasswordForEmail` based on state flags.

### `UpdatePassword.tsx`
* **Purpose:** Handles credential recovery and new password setting.
* **Under the Hood / Code Mechanics:**
  * **Session Verification:** Immediately calls `supabase.auth.getSession()` on submit. If the user clicked an expired or invalid email link, the session will be null, and it blocks the update.
  * **Action Flow:** Uses `supabase.auth.updateUser` to commit the new password, shows a success state, and then manually redirects to `/auth` using `window.location.href` to force a hard reload and clear the recovery state context.

---

## ⚡ Frontend Optimization Patterns Used
1. **`useMemo` & `useCallback`:** Heavily utilized across analytics pages to prevent unnecessary re-renders of complex charts and filtered lists during user input.
2. **AbortControllers:** Every major API hook (`useEffect` data fetchers) implements `AbortController` to cancel pending fetch requests if the user rapidly navigates away from the page, preventing memory leaks and state updates on unmounted components.
3. **Session Storage Caching:** `Trends.tsx` stores the `searchQuery` and `activeCountry` in `sessionStorage` so users don't lose their context if they accidentally refresh or navigate back from the `FullReport` page.
