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
