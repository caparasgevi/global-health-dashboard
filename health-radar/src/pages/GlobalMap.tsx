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

type OutbreakPoint = { id: string; country: string; latitude: number; longitude: number; iso2: string; };
type IllnessData = { name: string; value: number; year: number | string; type: "Acute" | "Chronic"; };
type LiveAlert = { title: string; date: string; url: string; summary: string; };

const ACUTE_KEYWORDS = ["MALARIA", "DENGUE", "CHOLERA", "MEASLES", "FEVER", "EBOLA", "ZIKA", "OUTBREAK", "TUBERCULOSIS"];

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
    try {
      const [alerts, allIndicators] = await Promise.all([
        healthService.getOutbreakNews(3),
        healthService.getRankedIndicators(),
      ]);
      setLiveAlerts((alerts || []).map((a: any) => ({
        title: a.title, date: a.date, url: a.url, summary: a.summary
      })));
      
      const candidateIndicators = (allIndicators || []).slice(0, 60);
      const results = await Promise.allSettled(
        candidateIndicators.map(async (ind: any) => {
          const stats = await healthService.checkIndicatorStatus(ind.IndicatorCode, country.id);
          if (!stats?.[0]) return null;
          const val = stats[0]._safeValue ?? stats[0].NumericValue ?? 0;
          return {
            name: ind.IndicatorName,
            value: Number(val),
            year: stats[0].TimeDim ?? "N/A",
            type: ACUTE_KEYWORDS.some(k => ind.IndicatorName.toUpperCase().includes(k)) ? "Acute" : "Chronic"
          } as IllnessData;
        })
      );
      const final = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean) as IllnessData[];
      setHealthRisks(final.sort((a,b) => (a.type === 'Acute' ? -1 : 1)).slice(0, 6));
    } finally { setIsSearching(false); }
  };

  const handleCountrySelect = (target: OutbreakPoint) => {
    setSearchQuery(target.country);
    setShowSuggestions(false);
    setSelectedCountry(target);
    mapRef.current?.flyTo({ center: [target.longitude, target.latitude], zoom: 4, duration: 1500 });
    fetchSpecificRisks(target);
  };

  return (
    /* FIXED: Added id="global-map" for Header navigation and scroll tracking */
    <section id="global-map" className="py-12 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Global <span className="text-brand-red">Health Risk</span> Intelligence
          </h1>
        </div>

        <div className={`relative h-[650px] w-full overflow-hidden rounded-3xl border shadow-2xl transition-all duration-500 ${isDark ? 'border-white/10 bg-slate-900' : 'border-slate-300 bg-slate-200'}`}>
          
          <Map ref={mapRef} theme={isDark ? 'dark' : 'light'}>
            {outbreaks.map((p) => (
              <MapMarker key={p.id} longitude={p.longitude} latitude={p.latitude} onClick={() => handleCountrySelect(p)}>
                <div className="h-3 w-3 rounded-full bg-red-600 border border-white/50 shadow-lg cursor-pointer" />
              </MapMarker>
            ))}
          </Map>

          {/* 1. SEARCH BAR: FIXED TOP-LEFT */}
          <div className="absolute top-4 left-4 z-20 w-80">
            <div className={`backdrop-blur-lg border p-4 rounded-2xl shadow-xl ${isDark ? 'bg-slate-950/80 border-white/20 text-white' : 'bg-white/80 border-slate-300 text-slate-900'}`}>
              <div className="flex items-center gap-2 text-brand-red font-bold text-[10px] uppercase tracking-widest mb-3">
                <Search size={14} /> Search Country
              </div>
              <input
                className={`w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}
                placeholder="Type to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && (
                <div className={`mt-2 border rounded-xl max-h-40 overflow-y-auto ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                  {outbreaks.filter(o => o.country.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(s => (
                    <button key={s.id} onClick={() => handleCountrySelect(s)} className="w-full text-left px-4 py-2 text-xs hover:bg-red-500/10">
                      {s.country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2 & 3. INFO CONTAINER: POSITIONED TOP-RIGHT, LEFT OF THE ZOOM CONTROLS */}
          {selectedCountry && (
            <div className="absolute top-4 right-[60px] z-20 w-80 h-[580px]">
              <div className={`h-full backdrop-blur-xl border rounded-2xl flex flex-col shadow-2xl overflow-hidden ${isDark ? 'bg-slate-950/85 border-white/20' : 'bg-white/90 border-slate-300'}`}>
                <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedCountry.country}</h2>
                    <p className="text-[10px] text-red-500 font-bold uppercase">Risk Intelligence</p>
                  </div>
                  <button onClick={() => setSelectedCountry(null)} className="p-1 hover:bg-red-500/10 rounded-full transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isSearching ? <div className="text-center py-20 animate-pulse text-xs uppercase tracking-tighter">Analyzing...</div> : (
                    <>
                      {liveAlerts.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase"><Activity size={14} /> Alerts</div>
                          {liveAlerts.map((alert, i) => (
                            <div key={i} className={`p-2 border rounded-lg text-[10px] ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                              {alert.title}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-red-500 text-[10px] font-bold uppercase flex items-center gap-2"><Skull size={14}/> Threats</div>
                      {healthRisks.map((risk, i) => (
                        <div key={i} className={`p-3 rounded-xl border ${risk.type === 'Acute' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-500/5 border-slate-500/20'}`}>
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className={risk.type === 'Acute' ? 'text-red-500' : 'text-slate-400'}>{risk.name}</span>
                            {risk.type === 'Acute' ? <AlertTriangle size={12}/> : <ShieldAlert size={12}/>}
                          </div>
                          <div className={`text-xl font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{risk.value.toLocaleString()}</div>
                        </div>
                      ))}
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