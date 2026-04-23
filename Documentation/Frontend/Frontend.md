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
