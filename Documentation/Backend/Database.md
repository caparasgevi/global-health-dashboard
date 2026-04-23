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
