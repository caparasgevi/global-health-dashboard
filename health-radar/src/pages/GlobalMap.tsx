import React, { useEffect, useRef, useState } from "react";
import { Map, MapMarker, type MapRef } from "../components/ui/Map";
import { healthService } from "../services/healthService";
import {
  AlertTriangle,
  X,
  Search,
  Skull,
  Activity,
} from "lucide-react";

type OutbreakPoint = { id: string; country: string; latitude: number; longitude: number; iso2: string; };
type IllnessData = { name: string; value: number; year: number | string; };
type LiveAlert = { title: string; date: string; url: string; summary: string; };

interface GlobalMapProps {
  isDark: boolean;
}

const GlobalMap: React.FC<GlobalMapProps> = ({ isDark }) => {
  const mapRef = useRef<MapRef | null>(null);
  const [outbreaks, setOutbreaks] = useState<OutbreakPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<OutbreakPoint | null>(null);
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
      } catch (e) { console.error("Map data error", e); }
    };
    initMapData();
  }, []);

  const fetchSpecificRisks = async (country: OutbreakPoint) => {
    setIsSearching(true);
    setHealthRisks([]); 
    setLiveAlerts([]);

    try {
      // Step 1: Fetch live news alerts and the country-specific bulk stats
      const [alerts, countryStats] = await Promise.all([
        healthService.getOutbreakNews(3),
        healthService.getLiveCountryStats(country.id)
      ]);

      setLiveAlerts((alerts || []).map((a: any) => ({
        title: a.title, date: a.date, url: a.url, summary: a.summary
      })));

      let potentialRisks: IllnessData[] = [];

      // Step 2: Use bulk country stats if the backend provides them (Efficient)
      if (countryStats && Array.isArray(countryStats) && countryStats.length > 0) {
        potentialRisks = countryStats
          .map((item: any) => ({
            name: item.IndicatorName || "Unknown Risk",
            value: Number(item._safeValue ?? item.NumericValue ?? 0),
            year: item.TimeDim ?? "N/A"
          }))
          .filter(risk => risk.value > 0);
      }

      // Step 3: Deep Scan Fallback 
      // If the bulk endpoint is empty, we scan the top 120 indicators manually
      if (potentialRisks.length === 0) {
        const allIndicators = await healthService.getRankedIndicators();
        const candidateIndicators = (allIndicators || []).slice(0, 120);

        const deepScanResults = await Promise.allSettled(
          candidateIndicators.map(async (ind: any) => {
            const stats = await healthService.checkIndicatorStatus(ind.IndicatorCode, country.id);
            if (!stats?.[0]) return null;
            
            const val = stats[0]._safeValue ?? stats[0].NumericValue ?? 0;
            if (val <= 0) return null; // CRITICAL: Filter out illnesses with 0 cases

            return {
              name: ind.IndicatorName,
              value: Number(val),
              year: stats[0].TimeDim ?? "N/A",
            };
          })
        );

        potentialRisks = deepScanResults
          .map(r => r.status === 'fulfilled' ? r.value : null)
          .filter(Boolean) as IllnessData[];
      }

      // Step 4: DYNAMIC SORTING
      // We sort by 'value' in descending order so the biggest threats for THIS country rise to the top.
      const sortedRisks = potentialRisks.sort((a, b) => b.value - a.value);

      // Present the top 6 unique high-risk illnesses for the country
      setHealthRisks(sortedRisks.slice(0, 6));

    } catch (err) {
      console.error("Health fetch error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCountrySelect = (target: OutbreakPoint) => {
    setSearchQuery(target.country);
    setShowSuggestions(false);
    setSelectedCountry(target);
    mapRef.current?.flyTo({ center: [target.longitude, target.latitude], zoom: 4, duration: 1500 });
    fetchSpecificRisks(target);
  };

  return (
    <section id="global-map" className="py-8 md:py-12 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Global <span className="text-brand-red">Health Risk</span> Intelligence
          </h1>
        </div>

        <div className={`relative h-[500px] md:h-[650px] w-full overflow-hidden rounded-2xl md:rounded-3xl border shadow-2xl transition-all duration-500 ${isDark ? 'border-white/10 bg-slate-900' : 'border-slate-300 bg-slate-200'}`}>
          <Map ref={mapRef} theme={isDark ? 'dark' : 'light'}>
            {outbreaks.map((p) => (
              <MapMarker key={p.id} longitude={p.longitude} latitude={p.latitude} onClick={() => handleCountrySelect(p)}>
                <div className="h-3 w-3 rounded-full bg-red-600 border border-white/50 shadow-lg cursor-pointer" />
              </MapMarker>
            ))}
          </Map>

          <div className="absolute top-3 left-3 right-3 z-20 md:w-80 md:right-auto md:top-4 md:left-4">
            <div className={`backdrop-blur-lg border p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl ${isDark ? 'bg-slate-950/80 border-white/20 text-white' : 'bg-white/80 border-slate-300 text-slate-900'}`}>
              <div className="flex items-center gap-2 text-brand-red font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-2 md:mb-3">
                <Search size={14} /> Search Country
              </div>
              <input
                className={`w-full border rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm outline-none focus:ring-1 focus:ring-red-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}
                placeholder="Type to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && (
                <div className={`mt-2 border rounded-lg md:rounded-xl max-h-32 md:max-h-40 overflow-y-auto ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                  {outbreaks.filter(o => o.country.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(s => (
                    <button key={s.id} onClick={() => handleCountrySelect(s)} className="w-full text-left px-4 py-2 text-xs hover:bg-red-500/10">
                      {s.country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedCountry && (
            <div className="absolute bottom-3 left-3 right-3 md:bottom-auto md:top-4 md:right-[60px] md:left-auto z-20 md:w-80 h-[300px] md:h-[580px]">
              <div className={`h-full backdrop-blur-xl border rounded-xl md:rounded-2xl flex flex-col shadow-2xl overflow-hidden ${isDark ? 'bg-slate-950/85 border-white/20' : 'bg-white/90 border-slate-300'}`}>
                <div className={`p-3 md:p-4 border-b flex justify-between items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <h2 className={`font-bold text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedCountry.country}</h2>
                    <p className="text-[9px] md:text-[10px] text-red-500 font-bold uppercase">Risk Intelligence</p>
                  </div>
                  <button onClick={() => setSelectedCountry(null)} className="p-1 hover:bg-red-500/10 rounded-full transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                  {isSearching ? <div className="text-center py-10 md:py-20 animate-pulse text-[10px] uppercase tracking-tighter">Scanning Regional Threats...</div> : (
                    <>
                      {liveAlerts.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-amber-500 text-[9px] md:text-[10px] font-bold uppercase"><Activity size={14} /> Alerts</div>
                          {liveAlerts.map((alert, i) => (
                            <div key={i} className={`p-2 border rounded-lg text-[9px] md:text-[10px] ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                              {alert.title}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-red-500 text-[9px] md:text-[10px] font-bold uppercase flex items-center gap-2"><Skull size={14}/> Top Real-Time Threats</div>
                      
                      <div className="grid grid-cols-1 gap-2 md:gap-4">
                        {healthRisks.length > 0 ? (
                          healthRisks.map((risk, i) => (
                            <div key={i} className={`p-2 md:p-3 rounded-lg md:rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex justify-between text-[9px] md:text-[10px] font-bold mb-1">
                                <span className="text-red-500">{risk.name}</span>
                                <AlertTriangle size={12} className="text-red-500"/>
                              </div>
                              <div className={`text-lg md:text-xl font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {risk.value.toLocaleString()}
                              </div>
                              <div className="text-[8px] opacity-50 uppercase">Reporting Year: {risk.year}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 md:py-24 border border-dashed rounded-xl border-slate-300 opacity-40 text-[10px] uppercase">
                            No high-volume threats reported
                          </div>
                        )}
                      </div>
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