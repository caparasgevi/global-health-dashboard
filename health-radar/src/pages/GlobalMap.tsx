import React, { useEffect, useRef, useState } from "react";
import { Map, MapMarker, type MapRef } from "../components/ui/Map";
import { healthService } from "../services/healthService";
import {
  AlertTriangle,
  ShieldAlert,
  X,
  Search,
  Skull,
  Activity,
} from "lucide-react";

type OutbreakPoint = {
  id: string; // ISO3
  country: string;
  latitude: number;
  longitude: number;
  iso2: string;
};

type IllnessData = {
  name: string;
  value: number;
  year: number | string;
  type: "Acute" | "Chronic";
};

type LiveAlert = {
  title: string;
  date: string;
  url: string;
  summary: string;
};

const ACUTE_KEYWORDS = [
  "MALARIA",
  "DENGUE",
  "CHOLERA",
  "MEASLES",
  "FEVER",
  "EBOLA",
  "ZIKA",
  "OUTBREAK",
  "TUBERCULOSIS",
];

const GlobalMap: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [outbreaks, setOutbreaks] = useState<OutbreakPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<OutbreakPoint | null>(
    null
  );
  const [healthRisks, setHealthRisks] = useState<IllnessData[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const initMapData = async () => {
      try {
        const response = await fetch("https://disease.sh/v3/covid-19/countries");
        const data = await response.json();

        const points = data.map((item: any) => ({
          id: item.countryInfo.iso3,
          iso2: item.countryInfo.iso2,
          country: item.country,
          latitude: item.countryInfo.lat,
          longitude: item.countryInfo.long,
        }));

        setOutbreaks(points);
      } catch (e) {
        console.error("Map initialization failed", e);
      }
    };

    initMapData();
  }, []);

  const fetchSpecificRisks = async (country: OutbreakPoint) => {
    setIsSearching(true);
    setHealthRisks([]);
    setLiveAlerts([]);

    try {
      const [alerts, allIndicators] = await Promise.all([
        healthService.getOutbreakNews(3),
        healthService.getRankedIndicators(),
      ]);

      setLiveAlerts(
        (alerts || []).map((a: any) => ({
          title: a.title || "WHO outbreak update",
          date: a.date || "",
          url: a.url || "",
          summary: a.summary || "",
        }))
      );

      const candidateIndicators = (allIndicators || []).slice(0, 80);

      const results = await Promise.allSettled(
        candidateIndicators.map(async (ind: any) => {
          const stats = await healthService.checkIndicatorStatus(
            ind.IndicatorCode,
            country.id
          );

          const latest = stats?.[0];
          if (!latest) return null;

          const rawValue =
            latest._safeValue ?? latest.NumericValue ?? latest.Value ?? null;

          const numericValue =
            rawValue === null || rawValue === undefined
              ? null
              : Number(rawValue);

          const indicatorName = String(
            ind.IndicatorName || ind.IndicatorCode || ""
          ).toUpperCase();

          const isAcute = ACUTE_KEYWORDS.some((k) =>
            indicatorName.includes(k)
          );

          return {
            name: ind.IndicatorName || ind.IndicatorCode,
            value: Number.isFinite(numericValue as number)
              ? (numericValue as number)
              : 0,
            year: latest.TimeDim ?? "N/A",
            type: isAcute ? "Acute" : "Chronic",
          } as IllnessData;
        })
      );

      const finalData = results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((r): r is IllnessData => r !== null)
        .sort((a, b) => {
          if (a.type === "Acute" && b.type !== "Acute") return -1;
          if (a.type !== "Acute" && b.type === "Acute") return 1;
          return b.value - a.value;
        });

      setHealthRisks(finalData.slice(0, 6));
    } catch (error) {
      console.error("Data fetch failed", error);
      setHealthRisks([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCountrySelect = (target: OutbreakPoint) => {
    setSearchQuery(target.country);
    setShowSuggestions(false);
    setSelectedCountry(target);

    mapRef.current?.flyTo({
      center: [target.longitude, target.latitude],
      zoom: 4,
      duration: 2000,
    });

    fetchSpecificRisks(target);
  };

  return (
    <section
      id="global-map"
      className="py-12 bg-white dark:bg-slate-950 transition-colors duration-300 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Global <span className="text-brand-red">Health Risk</span>{" "}
            Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Authentic WHO disease surveillance and high-risk regional monitoring.
          </p>
        </div>

        <div className="relative h-[650px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-2xl dark:border-white/10">
          <Map ref={mapRef}>
            {outbreaks.map((p) => (
              <MapMarker
                key={p.id}
                longitude={p.longitude}
                latitude={p.latitude}
                onClick={() => handleCountrySelect(p)}
              >
                <div className="h-3 w-3 rounded-full bg-red-600 border border-white/50 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              </MapMarker>
            ))}
          </Map>

          {/* SEARCH BOX */}
          <div className="absolute top-6 left-6 z-20 w-80">
            <div className="bg-slate-950 border border-white/20 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-brand-red font-bold text-[10px] uppercase tracking-widest">
                <Search size={14} /> Regional Search
              </div>

              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-red-500"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
              />

              {showSuggestions && (
                <div className="mt-2 bg-slate-900 border border-white/10 rounded-xl max-h-48 overflow-y-auto">
                  {outbreaks
                    .filter((o) =>
                      o.country.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 6)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleCountrySelect(s)}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-red-900/30"
                      >
                        {s.country}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* RISK INFORMATION PANEL */}
          {selectedCountry && (
            <div className="absolute top-6 right-6 bottom-6 z-20 w-80">
              <div className="h-full bg-slate-950 border border-white/20 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedCountry.country}
                    </h2>
                    <p className="text-[10px] text-red-500 font-mono font-bold uppercase tracking-tighter">
                      Diagnostic Intelligence
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="p-2 hover:bg-white/10 rounded-full"
                  >
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {isSearching ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="h-8 w-8 border-2 border-red-500/20 border-t-red-600 rounded-full animate-spin" />
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Scanning Global Registries...
                      </p>
                    </div>
                  ) : (
                    <>
                      {liveAlerts.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase italic">
                            <Activity size={14} /> Active Emergency Alerts
                          </div>

                          {liveAlerts.map((alert, i) => (
                            <a
                              key={i}
                              href={alert.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 hover:bg-amber-500/15 transition"
                            >
                              <p className="text-[11px] text-amber-200 leading-tight font-medium mb-1">
                                {alert.title}
                              </p>
                              <p className="text-[9px] text-amber-500/70 font-mono">
                                {alert.date}
                              </p>
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase">
                        <Skull size={14} /> Validated Health Threats
                      </div>

                      {healthRisks.length > 0 ? (
                        healthRisks.map((risk, i) => (
                          <div
                            key={i}
                            className={`rounded-xl p-4 border transition-all ${
                              risk.type === "Acute"
                                ? "bg-red-500/5 border-red-500/20 shadow-inner"
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-tight leading-relaxed ${
                                  risk.type === "Acute"
                                    ? "text-red-400"
                                    : "text-slate-400"
                                }`}
                              >
                                {risk.name}
                              </span>
                              {risk.type === "Acute" ? (
                                <AlertTriangle
                                  size={14}
                                  className="text-red-500"
                                />
                              ) : (
                                <ShieldAlert
                                  size={14}
                                  className="text-slate-500"
                                />
                              )}
                            </div>

                            <div className="flex justify-between items-end">
                              <span className="text-2xl font-mono text-white">
                                {risk.value.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                CY-{risk.year}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
                          No quantified indicator values were returned for this
                          country. Try another country or search a disease name
                          later when you add illness search.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default GlobalMap;