import React, { useEffect, useState, useMemo, memo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatWHOData } from '../../utils/healthDataFormat';
import { healthService } from '../../services/healthService';
import axios from 'axios'; // Import axios to use isCancel

interface TrendChartProps {
  indicatorCode?: string;
  countryCode?: string;
  title?: string;
  description?: string;
}

const TrendChart: React.FC<TrendChartProps> = memo(({
  indicatorCode = 'WHOSIS_000001',
  countryCode = 'PHL',
  title = "Health Progress",
  description = "Detailed surveillance of infectious disease trends and reported cases."
}) => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const responseData = await healthService.checkIndicatorStatus(
          indicatorCode,
          countryCode,
          { signal: controller.signal }
        );

        if (isMounted && responseData) {
          setRawData(responseData);
        }
      } catch (error: any) {
        if (axios.isCancel(error) || error?.name === 'AbortError') {
          return; 
        }
        console.error("Fetch Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [indicatorCode, countryCode]);

  const { chartData, trend } = useMemo(() => {
    if (!rawData || !rawData.length) return { chartData: [], trend: 'stable' as const };

    const formatted = formatWHOData(rawData);
    const sorted = [...formatted]
      .filter((entry: any) => entry.value > 0)
      .sort((a: any, b: any) => a.year - b.year);

    let currentTrend: 'rising' | 'falling' | 'stable' = 'stable';

    if (sorted.length >= 3) {
      const last = sorted[sorted.length - 1].value;
      const avgPrev = (sorted[sorted.length - 2].value + sorted[sorted.length - 3].value) / 2;
      const changePct = (last - avgPrev) / avgPrev;

      if (changePct > 0.05) currentTrend = 'rising';
      else if (changePct < -0.05) currentTrend = 'falling';
      else currentTrend = 'stable';
    } else if (sorted.length === 2) {
      const last = sorted[1].value;
      const prev = sorted[0].value;
      currentTrend = last > prev ? 'rising' : last < prev ? 'falling' : 'stable';
    }

    return { chartData: sorted, trend: currentTrend };
  }, [rawData]);

  const trendColor = trend === 'rising' ? '#ef4444' : trend === 'falling' ? '#10b981' : '#f59e0b';
  const trendLabel = trend === 'rising' ? 'Cases Increasing' : trend === 'falling' ? 'Cases Declining' : 'Cases Stable';
  const trendBadgeClass = trend === 'rising' ? 'bg-red-500/10 text-red-500' : trend === 'falling' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500';

  if (!loading && chartData.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-slate-400 text-xs italic leading-relaxed">
          Insufficient data to perform a trend analysis for <br />
          <span className="text-slate-500 dark:text-slate-300 font-bold not-italic">"{title}"</span>
        </p>
        <div className="no-data-signal hidden" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900/40 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center ${trendBadgeClass}`}>
            {trendLabel}
          </span>
          <span className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase">{indicatorCode}</span>
        </div>
        <h3 className="text-slate-900 dark:text-white text-lg md:text-xl font-bold leading-tight min-h-[3rem] flex items-center">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] md:text-xs mt-1 md:mt-2 leading-relaxed italic line-clamp-2">{description}</p>
      </div>

      {/* FIXED: Wrapper div with concrete height to prevent ResponsiveContainer size errors */}
      <div className="flex-1 min-h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorRisk-${indicatorCode}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }}
              minTickGap={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 9 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
              itemStyle={{ color: trendColor, fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={trendColor}
              strokeWidth={2}
              fill={`url(#colorRisk-${indicatorCode})`}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
        <h4 className="text-slate-900 dark:text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-1">Traveler Guidance</h4>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-snug">
          {trend === 'rising'
            ? "Caution: Upward trajectory detected. Follow local safety advisories."
            : trend === 'falling'
              ? "Data shows a downward trend. Maintain standard hygiene protocols."
              : "Data shows a stable trend. Check recent updates before travel."}
        </p>
      </div>
    </div>
  );
});

export default TrendChart;