import React, { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Dot } from 'recharts';
import { formatWHOData } from '../../utils/healthDataFormat';

interface TrendChartProps {
  indicatorCode?: string;
  countryCode?: string; 
  title?: string;
  description?: string; 
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  indicatorCode = 'WHOSIS_000001',
  countryCode = 'PHL',
  title = "Health Progress",
  description = "Detailed surveillance of infectious disease trends and reported cases."
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<'rising' | 'falling' | 'stable'>('stable');

  useEffect(() => {
    let isMounted = true;

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `https://cors-anywhere.herokuapp.com/https://ghoapi.azureedge.net/api/${indicatorCode}?$format=json&$filter=SpatialDim eq '${countryCode}'`;
        const response = await fetch(url, { signal: controller.signal });
        const responseData = await response.json();
        
        if (responseData?.value?.length > 0) {
          const formatted = formatWHOData(responseData.value);
          const sorted = formatted.sort((a: any, b: any) => a.year - b.year);

          if (isMounted) {
            setData(sorted);
            if (sorted.length >= 2) {
              const last = sorted[sorted.length - 1].value;
              const prev = sorted[sorted.length - 2].value;
              if (last > prev) setTrend('rising');
              else if (last < prev) setTrend('falling');
            }
          }
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error("Fetch Error:", error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; controller.abort(); };
  }, [indicatorCode, countryCode]);

  if (loading) return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
      <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing GHO Data...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900/40 p-6 transition-colors duration-300">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
            trend === 'rising' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            {trend === 'rising' ? '📈 Cases Increasing' : '📉 Cases Declining'}
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase">{indicatorCode}</span>
        </div>
        
        <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight line-clamp-2 h-14">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed italic">{description}</p>
      </div>

      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
            <XAxis 
              dataKey="year" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }} 
              className="text-slate-400 dark:text-slate-500" 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 10 }} 
              className="text-slate-400 dark:text-slate-500" 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#ef4444" 
              strokeWidth={3} 
              fill="url(#colorRisk)" 
              activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              dot={{ r: 4, fill: '#ef4444', opacity: 0.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
        <h4 className="text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-red animate-ping"></span>
          Traveler Guidance
        </h4>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
          {trend === 'rising' 
            ? "Caution: Upward trajectory detected. Ensure vaccinations are up to date before arrival." 
            : "Data shows a stable or downward trend, but standard hygiene and local health protocols should remain a priority."}
        </p>
      </div>
    </div>
  );
};

export default TrendChart;
