# 🖥️ Frontend Documentation

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
