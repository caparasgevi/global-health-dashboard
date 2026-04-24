# 🛡️ Health Radar 
[![Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/caparasgevi/global-health-dashboard)

**Health Radar** is a full-stack, real-time global health surveillance platform. It is engineered to monitor and visualize emerging disease outbreaks by acting as an early-warning system. 

Moving beyond simple data aggregation, the platform utilizes a Hybrid Data Fusion architecture. By prioritizing leading indicators over lagging metrics, the system calculates predictive risk scores, providing actionable intelligence through a dynamic geospatial interface.

✨ Core Features

Leading-Indicator Risk Engine: Calculates global threat levels using exponential growth factors rather than relying solely on lagging mortality rates.

Time Machine Simulator: An interactive analytical tool that allows users to scrub backward through 30 days of case history. It dynamically recalculates global leaderboards in milliseconds to visualize the exact moment an outbreak hits exponential velocity.

Unified Master Roster: Cross-references World Health Organization (WHO) datasets with live epidemiological APIs. It automatically injects missing nations to guarantee 100% global coverage and eliminate geopolitical data gap.

Interactive Global Map: A responsive, dark-mode optimized geospatial dashboard for real-time hotspot tracking.

🧬 System Architecture & The Risk Algorithm


To generate accurate, 0-100 safety scores without penalizing nations for robust reporting, the backend processes three mathematical pillars:

1. **The Anchor (Static Baseline)**



We establish a baseline vulnerability score derived from established health indices (infrastructure, security, and long-term outcomes). We invert the standard metric to calculate risk:

$$Base_Risk = 100 - \text{Health Index}$$

This stable proxy is split into Systemic Infrastructure (70%) and Endemic Burden (30%). If live API data is temporarily unavailable, the system safely falls back to this baseline.

2. **The Sensor (Real-Time Telemetry)**



The system fetches live data to measure the immediate momentum of a disease. The primary driver is the Epidemic Growth Factor, measuring surge acceleration over rolling 7-day windows:

$$Growth_Factor = \frac{\text{New Cases This Week}}{\text{New Cases Last Week}}$$ 

3. **The Fusion**



The backend unifies the static anchor with the real-time velocity penalties, capping the result to maintain a consistent scale.

$$Final_Score = \min(100, Base_Risk + \text{Velocity Penalty} + \text{Fatality Penalty})$$ 

## 🛠️ Technical Stack
**Frontend (Client)**
* **React.js & TypeScript:** Component-driven UI architecture.
* **Vite & React Router DOM:** High-speed bundling and protected route logic.
* **Framer Motion:** Fluid, lazy-loaded animations for seamless data rendering.
* **Recharts:** Complex data visualization for historical trends.

**Backend (Intelligence Layer)**
* **Node.js & Express.js:** Custom middleware for API aggregation and data sanitization.
* **Vercel Serverless:** Optimized edge deployment with aggressive caching protocols.

**Database & Auth**
* **Supabase (PostgreSQL):** Relational data management and secure authentication.
* **Row Level Security (RLS):** Strict access policies for user configurations.

**External APIs**
* WHO Global Health Observatory (GHO)
* Disease.sh (Open Epidemiological Data)
* Pexels API (Contextual Visual Content)

## 🚀 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/caparasgevi/global-health-dashboard.git](https://github.com/caparasgevi/global-health-dashboard.git)
   cd global-health-dashboard

2. **Install dependencies:**

```bash
npm install
.

3. **Configure Environment Variables:**
Create a .env file in the root directory and add your Supabase and API keys:

```Code snippet
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
.

4. **Start the development server:**

```bash
npm run dev
