import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import iso from "iso-3166-1";
import {
  Map,
  MapMarker,
  MapControls,
  MarkerContent,
  MarkerTooltip,
  type MapRef,
} from "../components/ui/Map";
import { healthService } from "../services/healthService";

type OutbreakPoint = {
  id: string;
  country: string;
  latitude: number;
  longitude: number;
  cases: number;
  region?: string;
  note?: string;
};

type CountryCenter = {
  longitude: number;
  latitude: number;
};

const FALLBACK_OUTBREAKS: OutbreakPoint[] = [
  { id: "ph", country: "Philippines", latitude: 12.8797, longitude: 121.774, cases: 2480, region: "Western Pacific", note: "Sample outbreak center" },
  { id: "id", country: "Indonesia", latitude: -0.7893, longitude: 113.9213, cases: 1840, region: "South-East Asia", note: "Sample outbreak center" },
  { id: "in", country: "India", latitude: 20.5937, longitude: 78.9629, cases: 3225, region: "South-East Asia", note: "Sample outbreak center" },
  { id: "br", country: "Brazil", latitude: -14.235, longitude: -51.9253, cases: 2710, region: "Americas", note: "Sample outbreak center" },
  { id: "ng", country: "Nigeria", latitude: 9.082, longitude: 8.6753, cases: 960, region: "Africa", note: "Sample outbreak center" },
];

const FALLBACK_CENTERS: Record<string, CountryCenter> = {
  Philippines: { longitude: 121.774, latitude: 12.8797 },
  Indonesia: { longitude: 113.9213, latitude: -0.7893 },
  India: { longitude: 78.9629, latitude: 20.5937 },
  Brazil: { longitude: -51.9253, latitude: -14.235 },
  Nigeria: { longitude: 8.6753, latitude: 9.082 },
  China: { longitude: 104.1954, latitude: 35.8617 },
  Japan: { longitude: 138.2529, latitude: 36.2048 },
  Australia: { longitude: 133.7751, latitude: -25.2744 },
  Canada: { longitude: -106.3468, latitude: 56.1304 },
  Mexico: { longitude: -102.5528, latitude: 23.6345 },
  "South Africa": { longitude: 22.9375, latitude: -30.5595 },
  Kenya: { longitude: 37.9062, latitude: -0.0236 },
  Egypt: { longitude: 30.8025, latitude: 26.8206 },
  "United Kingdom": { longitude: -3.436, latitude: 55.3781 },
  France: { longitude: 2.2137, latitude: 46.2276 },
  Germany: { longitude: 10.4515, latitude: 51.1657 },
  "United States": { longitude: -95.7129, latitude: 37.0902 },
  "United States of America": { longitude: -95.7129, latitude: 37.0902 },
};

function normalizeCountryName(name: string) {
  return name.trim().toLowerCase();
}

function getSeverity(casesCount: number) {
  if (casesCount >= 2500) return "high";
  if (casesCount >= 1000) return "medium";
  return "low";
}

function severityClasses(severity: "high" | "medium" | "low") {
  switch (severity) {
    case "high":
      return { dot: "bg-red-500", badge: "bg-red-500/10 text-red-500 border-red-500/20" };
    case "medium":
      return { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    default:
      return { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
  }
}

const GlobalMap: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [outbreaks, setOutbreaks] = useState<OutbreakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allCountries = useMemo(() => iso.all(), []);
  const activeOutbreaks = outbreaks.length > 0 ? outbreaks : FALLBACK_OUTBREAKS;

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchOutbreaks = async () => {
      setLoading(true);
      try {
        const service = healthService as any;
        let data: any[] = [];
        if (typeof service.getOutbreakPoints === "function") {
          data = await service.getOutbreakPoints({ signal: controller.signal });
        } else if (typeof service.getGlobalOutbreakPoints === "function") {
          data = await service.getGlobalOutbreakPoints({ signal: controller.signal });
        } else {
          data = FALLBACK_OUTBREAKS;
        }

        const normalized: OutbreakPoint[] = (Array.isArray(data) ? data : [])
          .map((item: any, index: number) => ({
            id: String(item.id ?? item.code ?? `${item.country ?? "point"}-${index}`),
            country: String(item.country ?? item.Country ?? item.name ?? "Unknown"),
            latitude: Number(item.latitude ?? item.lat ?? item.Latitude ?? item.Lat ?? 0),
            longitude: Number(item.longitude ?? item.lng ?? item.lon ?? item.Longitude ?? 0),
            cases: Number(item.cases ?? item.count ?? item.Cases ?? 0),
            region: item.region ?? item.Region ?? undefined,
            note: item.note ?? item.description ?? undefined,
          }))
          .filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && item.country !== "Unknown");

        if (mounted) setOutbreaks(normalized.length > 0 ? normalized : FALLBACK_OUTBREAKS);
      } catch (error) {
        if (mounted) setOutbreaks(FALLBACK_OUTBREAKS);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOutbreaks();
    return () => { mounted = false; controller.abort(); };
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const merged = [
      ...allCountries.filter(c => c.country.toLowerCase().includes(q)).map(c => c.country),
      ...activeOutbreaks.filter(o => o.country.toLowerCase().includes(q)).map(o => o.country),
    ];
    return Array.from(new Set(merged)).slice(0, 8);
  }, [activeOutbreaks, allCountries, searchQuery]);

  const topOutbreaks = useMemo(() => {
    return [...activeOutbreaks].sort((a, b) => b.cases - a.cases).slice(0, 5);
  }, [activeOutbreaks]);

  const selectedOutbreak = useMemo(() => {
    if (!selectedCountry) return null;
    const key = normalizeCountryName(selectedCountry);
    return activeOutbreaks.find(item => normalizeCountryName(item.country) === key) || null;
  }, [activeOutbreaks, selectedCountry]);

  const flyToCountry = useCallback((countryName: string) => {
    setSelectedCountry(countryName);
    setSearchQuery(countryName);
    setShowSuggestions(false);

    const outbreak = activeOutbreaks.find(item => normalizeCountryName(item.country) === normalizeCountryName(countryName));
    const fallback = FALLBACK_CENTERS[countryName] || Object.entries(FALLBACK_CENTERS).find(([key]) => normalizeCountryName(key) === normalizeCountryName(countryName))?.[1];

    const center: [number, number] = outbreak ? [outbreak.longitude, outbreak.latitude] : fallback ? [fallback.longitude, fallback.latitude] : [0, 18];

    mapRef.current?.flyTo({ center, zoom: outbreak || fallback ? 4.5 : 1.5, speed: 1.15, curve: 1.42, essential: true });
  }, [activeOutbreaks]);

  const resetMap = () => {
    setSearchQuery("");
    setSelectedCountry("");
    mapRef.current?.flyTo({ center: [0, 18], zoom: 1.5, speed: 1.15, curve: 1.42, essential: true });
  };

  return (
    <div className="flex flex-col lg:relative lg:h-[780px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-950">
      {/* Map Section: Fixed height on mobile, full height on desktop */}
      <div className="h-[450px] lg:h-full w-full relative shrink-0">
        <Map ref={mapRef} className="h-full w-full">
          {activeOutbreaks.map((point) => {
            const severity = getSeverity(point.cases);
            const classes = severityClasses(severity);
            const isSelected = selectedCountry && normalizeCountryName(selectedCountry) === normalizeCountryName(point.country);

            return (
              <MapMarker key={point.id} longitude={point.longitude} latitude={point.latitude} onClick={() => flyToCountry(point.country)}>
                <MarkerContent>
                  <div className="flex flex-col items-center">
                    <div className={`relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-lg ${classes.dot} ${isSelected ? "scale-125 ring-4 ring-white/30" : ""}`} />
                    <MarkerTooltip>
                      <div className="mt-2 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur text-white bg-slate-900/60">
                        {point.country}
                      </div>
                    </MarkerTooltip>
                  </div>
                </MarkerContent>
              </MapMarker>
            );
          })}
          <MapControls />
        </Map>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent hidden lg:block" />

      {/* UI Elements Wrapper: Stacks below map on mobile, absolute positioning on desktop */}
      <div className="flex flex-col lg:contents p-4 lg:p-0 gap-4 bg-slate-50 dark:bg-slate-900 lg:bg-transparent">
        
        {/* Search Panel */}
        <div className="lg:absolute lg:left-4 lg:top-4 lg:z-20 w-full lg:w-[23rem]">
          <div className="pointer-events-auto rounded-2xl border border-slate-200 lg:border-white/10 bg-white lg:bg-slate-950/85 p-3 shadow-xl lg:shadow-2xl backdrop-blur-xl dark:bg-slate-950/85">
            <div className="mb-2">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 lg:text-cyan-300">Global Map</div>
              <h2 className="mt-1 text-lg font-bold text-slate-900 lg:text-white dark:text-white">Outbreak Infrastructure</h2>
              <p className="mt-1 text-xs leading-snug text-slate-500 lg:text-slate-300">Search a country to locate the matching outbreak zone.</p>
            </div>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                placeholder="Search a country..."
                className="h-11 w-full rounded-xl border border-slate-200 lg:border-white/10 bg-slate-100 lg:bg-white/5 px-4 text-sm text-slate-900 lg:text-white outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400/20 dark:bg-white/5 dark:text-white"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-full overflow-hidden rounded-2xl border border-slate-200 lg:border-white/10 bg-white lg:bg-slate-950 shadow-2xl dark:bg-slate-900">
                  {suggestions.map((country) => (
                    <button key={country} onMouseDown={(e) => e.preventDefault()} onClick={() => flyToCountry(country)} className="flex w-full items-center justify-between border-b border-slate-100 lg:border-white/5 px-4 py-3 text-left text-sm text-slate-700 lg:text-slate-200 hover:bg-slate-50 lg:hover:bg-white/5 last:border-b-0 dark:text-slate-200 dark:hover:bg-white/5">
                      <span className="font-medium">{country}</span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400">Fly to</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend & Hotspots: Bottom containers */}
        <div className="flex flex-col lg:flex-row lg:absolute lg:bottom-4 lg:inset-x-4 lg:justify-between lg:z-20 gap-4">
          {/* Legend */}
          <div className="w-full lg:w-[20rem]">
            <div className="pointer-events-auto rounded-2xl border border-slate-200 lg:border-white/10 bg-white lg:bg-slate-950/85 p-4 shadow-xl backdrop-blur-xl dark:bg-slate-950/85">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Legend</div>
                  <div className="text-sm font-bold text-slate-900 lg:text-white dark:text-white">Severity Levels</div>
                </div>
                <button onClick={resetMap} className="rounded-full border border-slate-200 lg:border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 lg:text-slate-300 hover:bg-slate-50 lg:hover:bg-white/5">Reset</button>
              </div>
              <div className="space-y-2">
                {["low", "medium", "high"].map((severity) => {
                  const classes = severityClasses(severity as any);
                  return (
                    <div key={severity} className="flex items-center justify-between rounded-xl border border-slate-100 lg:border-white/5 bg-slate-50 lg:bg-white/5 px-3 py-2 dark:bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${classes.dot}`} />
                        <span className="text-xs font-medium text-slate-700 lg:text-slate-200 capitalize">{severity}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400">Cases</span>
                    </div>
                  );
                })}
              </div>
              {selectedOutbreak && (
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-50 lg:bg-cyan-400/10 p-3 dark:bg-cyan-900/20">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 lg:text-cyan-300">Active Selection</div>
                  <div className="mt-1 text-sm font-bold text-slate-900 lg:text-white dark:text-white">{selectedOutbreak.country}</div>
                  <div className="mt-1 text-xs text-slate-600 lg:text-slate-300">{selectedOutbreak.cases.toLocaleString()} cases</div>
                </div>
              )}
            </div>
          </div>

          {/* Hotspots */}
          <div className="w-full lg:w-[17rem]">
            <div className="pointer-events-auto rounded-2xl border border-slate-200 lg:border-white/10 bg-white lg:bg-slate-950/85 p-4 shadow-xl backdrop-blur-xl dark:bg-slate-950/85">
              <div className="mb-3">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Hotspots</div>
                <div className="text-sm font-bold text-slate-900 lg:text-white dark:text-white">Top centers</div>
              </div>
              <div className="space-y-2">
                {topOutbreaks.map((point, index) => (
                  <button key={point.id} onClick={() => flyToCountry(point.country)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 lg:border-white/5 bg-slate-50 lg:bg-white/5 px-3 py-2 text-left hover:bg-slate-100 lg:hover:bg-white/10 dark:bg-white/5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800 lg:text-slate-100 dark:text-white">{index + 1}. {point.country}</div>
                      <div className="text-[10px] text-slate-400">{point.region ?? "Global"}</div>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <div className="text-xs font-bold text-slate-900 lg:text-white dark:text-white">{point.cases.toLocaleString()}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">cases</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalMap;