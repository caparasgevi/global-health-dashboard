//GlobalMap.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import iso from "iso-3166-1";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  type MapRef,
} from "@/components/ui/Map";
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
  {
    id: "ph",
    country: "Philippines",
    latitude: 12.8797,
    longitude: 121.774,
    cases: 2480,
    region: "Western Pacific",
    note: "Sample outbreak center",
  },
  {
    id: "id",
    country: "Indonesia",
    latitude: -0.7893,
    longitude: 113.9213,
    cases: 1840,
    region: "South-East Asia",
    note: "Sample outbreak center",
  },
  {
    id: "in",
    country: "India",
    latitude: 20.5937,
    longitude: 78.9629,
    cases: 3225,
    region: "South-East Asia",
    note: "Sample outbreak center",
  },
  {
    id: "br",
    country: "Brazil",
    latitude: -14.235,
    longitude: -51.9253,
    cases: 2710,
    region: "Americas",
    note: "Sample outbreak center",
  },
  {
    id: "ng",
    country: "Nigeria",
    latitude: 9.082,
    longitude: 8.6753,
    cases: 960,
    region: "Africa",
    note: "Sample outbreak center",
  },
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
      return {
        dot: "bg-red-500",
        badge: "bg-red-500/10 text-red-500 border-red-500/20",
      };
    case "medium":
      return {
        dot: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      };
    default:
      return {
        dot: "bg-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
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
          data = await service.getGlobalOutbreakPoints({
            signal: controller.signal,
          });
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
          .filter(
            (item) =>
              Number.isFinite(item.latitude) &&
              Number.isFinite(item.longitude) &&
              item.country !== "Unknown"
          );

        if (mounted) {
          setOutbreaks(normalized.length > 0 ? normalized : FALLBACK_OUTBREAKS);
        }
      } catch (error) {
        console.error("Global map fetch error:", error);
        if (mounted) setOutbreaks(FALLBACK_OUTBREAKS);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOutbreaks();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const countryMatches = allCountries
      .filter((country) => country.country.toLowerCase().includes(q))
      .slice(0, 8);

    const outbreakMatches = activeOutbreaks
      .filter((item) => item.country.toLowerCase().includes(q))
      .slice(0, 8);

    const merged = [
      ...countryMatches.map((c) => c.country),
      ...outbreakMatches.map((o) => o.country),
    ];

    return Array.from(new Set(merged)).slice(0, 8);
  }, [activeOutbreaks, allCountries, searchQuery]);

  const topOutbreaks = useMemo(() => {
    return [...activeOutbreaks].sort((a, b) => b.cases - a.cases).slice(0, 5);
  }, [activeOutbreaks]);

  const selectedOutbreak = useMemo(() => {
    if (!selectedCountry) return null;
    const key = normalizeCountryName(selectedCountry);
    return (
      activeOutbreaks.find((item) => normalizeCountryName(item.country) === key) ||
      null
    );
  }, [activeOutbreaks, selectedCountry]);

  const flyToCountry = useCallback(
    (countryName: string) => {
      setSelectedCountry(countryName);
      setSearchQuery(countryName);
      setShowSuggestions(false);

      const outbreak = activeOutbreaks.find(
        (item) => normalizeCountryName(item.country) === normalizeCountryName(countryName)
      );

      const fallback =
        FALLBACK_CENTERS[countryName] ||
        Object.entries(FALLBACK_CENTERS).find(
          ([key]) => normalizeCountryName(key) === normalizeCountryName(countryName)
        )?.[1];

      const center: [number, number] = outbreak
      ? [outbreak.longitude, outbreak.latitude]
      : fallback
        ? [fallback.longitude, fallback.latitude]
        : [0, 18];

      mapRef.current?.flyTo({
        center,
        zoom: outbreak || fallback ? 4.5 : 1.5,
        speed: 1.15,
        curve: 1.42,
        essential: true,
      });
    },
    [activeOutbreaks]
  );

  const resetMap = () => {
    setSearchQuery("");
    setSelectedCountry("");
    mapRef.current?.flyTo({
      center: [0, 18],
      zoom: 1.5,
      speed: 1.15,
      curve: 1.42,
      essential: true,
    });
  };

  return (
    <div className="relative h-[780px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-950">
      <Map ref={mapRef} className="h-full w-full">
        <div className="absolute inset-0">
          {activeOutbreaks.map((point) => {
            const severity = getSeverity(point.cases);
            const classes = severityClasses(severity);
            const isSelected =
              selectedCountry &&
              normalizeCountryName(selectedCountry) ===
                normalizeCountryName(point.country);

            return (
              <MapMarker
                key={point.id}
                longitude={point.longitude}
                latitude={point.latitude}
                onClick={() => flyToCountry(point.country)}
              >
                <MarkerContent>
                  <div className="flex flex-col items-center">
                    <div
                      className={[
                        "relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-lg",
                        classes.dot,
                        isSelected ? "scale-125 ring-4 ring-white/30" : "",
                      ].join(" ")}
                    />
                    <MarkerTooltip>
                      <div className="mt-2 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur">
                        {point.country}
                      </div>
                    </MarkerTooltip>
                  </div>
                </MarkerContent>
              </MapMarker>
            );
          })}
        </div>

        <MapControls />
      </Map>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />

      <div className="absolute left-4 top-4 z-20 w-[min(92vw,23rem)]">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/85 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-2">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
              Global Map
            </div>
            <h2 className="mt-1 text-lg font-bold text-white">
              Outbreak Infrastructure
            </h2>
            <p className="mt-1 text-xs leading-snug text-slate-300">
              Search a country, then the map flies to the matching outbreak zone.
            </p>
          </div>

          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                window.setTimeout(() => setShowSuggestions(false), 120);
              }}
              placeholder="Search a country..."
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />

            {showSuggestions && suggestions.length > 0 ? (
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
                {suggestions.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => flyToCountry(country)}
                    className="flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/5 last:border-b-0"
                  >
                    <span className="font-medium">{country}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">
                      Fly to
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-20 w-[min(92vw,20rem)]">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Legend
              </div>
              <div className="text-sm font-bold text-white">Severity Levels</div>
            </div>
            <button
              type="button"
              onClick={resetMap}
              className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition hover:bg-white/5"
            >
              Reset
            </button>
          </div>

          <div className="space-y-2">
            {["low", "medium", "high"].map((severity) => {
              const classes = severityClasses(severity as "low" | "medium" | "high");
              return (
                <div
                  key={severity}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${classes.dot}`} />
                    <span className="text-xs font-medium text-slate-200 capitalize">
                      {severity}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">
                    Cases
                  </span>
                </div>
              );
            })}
          </div>

          {selectedOutbreak ? (
            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
                Active Selection
              </div>
              <div className="mt-1 text-sm font-bold text-white">
                {selectedOutbreak.country}
              </div>
              <div className="mt-1 text-xs text-slate-300">
                {selectedOutbreak.cases.toLocaleString()} reported cases
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute right-4 bottom-4 z-20 w-[min(92vw,17rem)]">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Hotspots
            </div>
            <div className="text-sm font-bold text-white">Top outbreak centers</div>
          </div>

          <div className="space-y-2">
            {topOutbreaks.map((point, index) => (
              <button
                key={point.id}
                type="button"
                onClick={() => flyToCountry(point.country)}
                className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {index + 1}. {point.country}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {point.region ?? "Global"}
                  </div>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <div className="text-xs font-bold text-white">
                    {point.cases.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                    cases
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalMap;