# 🖥️ PAGES - Frontend Documentation

## Overview
The **Health Radar** frontend is a high-performance Single Page Application (SPA) built with React. It heavily utilizes `framer-motion` for fluid page transitions, `recharts` for complex data visualizations, and custom hooks for efficient API interactions with the backend intelligence layer.

---

## 🌍 Surveillance & Mapping

### `GlobalMap.tsx`
* **Purpose:** The interactive visual centerpiece of the platform, allowing users to select nodes (countries) to view localized health intelligence.
* **Data Flow:**
  * Fetches geographical coordinates globally via `disease.sh`.
  * Upon selecting a country, it triggers `fetchSpecificRisks()`, calling the backend for **Disease Outbreak News (DONs)** and **WHO Indicators**, filtering for acute threats (e.g., Malaria, Dengue).
* **Technical Highlights:** Implements a custom map ref (`flyTo`) for smooth geographic transitions and a debounced, auto-filtering search bar overlaid on the map UI.

---

## 📊 Analytics & Intelligence

### `RiskScores.tsx` (The Time Machine)
* **Purpose:** A dynamic leaderboard displaying the calculated Risk Scores (0–100) for all tracked nations, complete with a detailed drill-down view.
* **Data Flow:** Fetches the baseline array from `/api/risk-scores` and deep-dives into historical timelines (`healthService.getHistoricalData`).
* **Technical Highlights:** * **Time Machine Algorithm:** Features an interactive slider (`timeOffset`) that allows users to rewind up to 14 days. The component *recalculates* the incidence rate, growth factor, and live penalty entirely on the client side in real-time using `useMemo`, instantly resorting the leaderboard without hitting the backend again.
  * **Visuals:** Uses `Recharts` (AreaChart) with custom gradient definitions to visualize outbreak acceleration.

### `Trends.tsx` & `FullReport.tsx`
* **Purpose:** Deep-dive analytical views comparing disease trajectories (e.g., current year vs. previous baseline).
* **Data Flow:** Utilizes a highly optimized "Disease Discovery" protocol. It checks batches of WHO indicators against a specific country to find active data points, prioritizing common threats (HIV, Tuberculosis, Cholera).
* **Technical Highlights:**
  * **Lazy Loading & Suspense:** Heavy chart components (`TrendChart`, `ComparisonChart`) are lazy-loaded to prevent blocking the initial page render.
  * **Infinite Scrolling:** Uses an `IntersectionObserver` (`lastElementRef`) to progressively load and render charts only when they enter the viewport, saving immense memory and API quota.
  * **Fallback States:** If no country is selected, it elegantly degrades to the `DefaultHealthDashboard`, showing a global comparison of Life Expectancy.

### `CountryStatistics.tsx`
* **Purpose:** A focused "Health System Audit" view for a specific nation.
* **Data Flow:** Blends static seed-based generation (for UI layout demonstration of Critical Care/Lab Capacity) with live COVID-19 data.
* **Technical Highlights:**
  * **Instant Search:** Pre-fetches the `restcountries` API on mount, allowing sub-millisecond local filtering for the country search dropdown.
  * **CSV Export:** Includes a functional `handleDownload` utility that generates and downloads a `.csv` report of the country's resource matrix directly from the browser.

---

## 🏠 Core Navigation & Content

### `Home.tsx`
* **Purpose:** The primary landing dashboard combining global baselines with breaking news.
* **Component Composition:**
  * **WHO Surveillance Archive:** Utilizes `Swiper.js` to create an auto-playing carousel of sanitized Disease Outbreak News, complete with contextual search links.
  * **Regional Threat Level:** Renders the cached `/api/global-baseline` data using animated `framer-motion` progress bars (`Counter` component) to represent regional systemic risks.

### `About.tsx` & `OurTeam.tsx`
* **Purpose:** Informational pages detailing the platform's methodology, data pipelines, and the engineering team behind it.
* **Technical Highlights:** Heavy use of `AnimatePresence` and staggered `framer-motion` variants. The Team page features an interactive "Reveal" mechanic, transitioning from a blurred group photo into an interactive, hover-responsive grid of individual profiles.

---

## 🔐 Security & Access

### `Auth.tsx` & `UpdatePassword.tsx`
* **Purpose:** Handles user entry, registration, and credential recovery.
* **Technical Highlights:** * **Hybrid Access:** Supports standard Supabase email/password authentication alongside an integrated "Guest Mode" (`localStorage.getItem("auth_mode")`), ensuring high conversion rates while protecting sensitive routes.
  * **Form Management:** Features controlled inputs with real-time validation, dynamic error/success banners, and an integrated `iso-3166-1` searchable dropdown to accurately bind a user to a specific country profile.

---

## ⚡ Frontend Optimization Patterns Used
1. **`useMemo` & `useCallback`:** Heavily utilized across analytics pages to prevent unnecessary re-renders of complex charts and filtered lists during user input.
2. **AbortControllers:** Every major API hook (`useEffect` data fetchers) implements `AbortController` to cancel pending fetch requests if the user rapidly navigates away from the page, preventing memory leaks and state updates on unmounted components.
3. **Session Storage Caching:** `Trends.tsx` stores the `searchQuery` and `activeCountry` in `sessionStorage` so users don't lose their context if they accidentally refresh or navigate back from the `FullReport` page.
