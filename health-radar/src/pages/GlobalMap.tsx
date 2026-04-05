import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Map, MapMarker, MarkerContent, type MapRef } from "../components/ui/Map";

// Using disease.sh for real-time global health data
const API_URL = "https://disease.sh/v3/covid-19/countries";

type OutbreakPoint = {
  id: string;
  country: string;
  latitude: number;
  longitude: number;
  cases: number;
  region?: string;
};

const GlobalMap: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [outbreaks, setOutbreaks] = useState<OutbreakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 1. Fetch Real Data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        const normalized = data.map((item: any) => ({
          id: item.countryInfo.iso3 || item.country,
          country: item.country,
          latitude: item.countryInfo.lat,
          longitude: item.countryInfo.long,
          cases: item.cases,
          region: item.continent,
        }));
        
        setOutbreaks(normalized);
      } catch (error) {
        console.error("Failed to fetch health data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return outbreaks
      .filter(o => o.country.toLowerCase().includes(q))
      .slice(0, 6);
  }, [outbreaks, searchQuery]);

  const topOutbreaks = useMemo(() => {
    return [...outbreaks].sort((a, b) => b.cases - a.cases).slice(0, 5);
  }, [outbreaks]);

  // 2. Responsive Fly-To Logic
  const flyToCountry = useCallback((target: OutbreakPoint) => {
    setSearchQuery(target.country);
    setShowSuggestions(false);
    mapRef.current?.flyTo({
      center: [target.longitude, target.latitude],
      zoom: 4,
      essential: true,
      duration: 2000
    });
  }, []);

  const getSeverity = (cases: number) => {
    if (cases > 1000000) return "high";
    if (cases > 100000) return "medium";
    return "low";
  };

  return (
    <section 
      id="global-map" 
      className="py-12 bg-white dark:bg-slate-950 transition-colors duration-300 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-montserrat">
              Global <span className="text-brand-red">Disease Map</span>
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-lg">
              Real-time visualization of global health data and outbreak concentrations across the globe.
            </p>
          </div>
        </div>

        {/* MAP CONTAINER */}
        <div className="relative h-[600px] lg:h-[780px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl dark:border-white/10">
          
          {/* MAP COMPONENT */}
          <Map ref={mapRef}>
            {outbreaks.map((point) => (
              <MapMarker 
                key={point.id} 
                longitude={point.longitude} 
                latitude={point.latitude} 
                onClick={() => flyToCountry(point)}
              >
                <MarkerContent>
                  <div className="group relative flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-150 ${
                      getSeverity(point.cases) === 'high' ? 'bg-red-500' : 
                      getSeverity(point.cases) === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:block z-50">
                      <div className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white shadow-xl whitespace-nowrap">
                        {point.country}: {point.cases.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </MarkerContent>
              </MapMarker>
            ))}
          </Map>

          {/* SEARCH UI (Absolute positioned over map) */}
          <div className="absolute left-6 top-6 z-20 w-80 pointer-events-auto">
            <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-4 backdrop-blur-md">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest text-cyan-400">Health Radar</h2>
              <p className="text-xs text-slate-400 mb-3">Live Outbreak Tracking</p>
              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search country..."
                  className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-cyan-500"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute mt-2 w-full rounded-xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
                    {suggestions.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => flyToCountry(s)}
                        className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/10 transition-colors"
                      >
                        {s.country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HOTSPOTS LIST (Bottom Right) */}
          <div className="absolute bottom-6 right-6 z-20 w-64 pointer-events-auto hidden md:block">
            <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-4 backdrop-blur-md text-white">
              <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-tighter">Top Hotspots</h3>
              <div className="space-y-3">
                {topOutbreaks.map((o, i) => (
                  <div 
                    key={o.id} 
                    onClick={() => flyToCountry(o)} 
                    className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                  >
                    <span className="text-xs">{i+1}. {o.country}</span>
                    <span className="text-xs font-mono text-red-400">{(o.cases / 1000000).toFixed(1)}M</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalMap;