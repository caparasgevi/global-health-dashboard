import React, { useEffect, useState, useMemo, memo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatWHOData } from '../../utils/healthDataFormat';
import { healthService } from '../../services/healthService';

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

        if (isMounted && responseData?.length > 0) {
          setRawData(responseData);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') console.error("Fetch Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; controller.abort(); };
  }, [indicatorCode, countryCode]);

  const { chartData, trend } = useMemo(() => {
    if (!rawData.length) return { chartData: [], trend: 'stable' as const };

    const formatted = formatWHOData(rawData);
    const sorted = [...formatted]
      .filter((entry: any) => entry.value > 0)
      .sort((a: any, b: any) => a.year - b.year);

    let currentTrend: 'rising' | 'falling' | 'stable' = 'stable';

    if (sorted.length >= 3) {
      const last = sorted[sorted.length - 1].value;
      const avgPrev = (sorted[sorted.length - 2].value + sorted[sorted.length - 3].value) / 2;
      const changePct = (last - avgPrev) / avgPrev;

      // Only trigger trend shifts if change is > 5% to account for reporting noise
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

  const getTrendIcon = () => {
    const iconClass = "w-3 h-3 mr-1.5 stroke-[2.5px]";

    if (trend === 'rising') return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
      </svg>
    );
    if (trend === 'falling') return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-9-9-4 4-6-6" />
      </svg>
    );
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    );
  };

  const trendLabel = trend === 'rising' ? 'Cases Increasing' : trend === 'falling' ? 'Cases Declining' : 'Cases Stable';

  const trendBadgeClass = trend === 'rising'
    ? 'bg-red-500/10 text-red-500'
    : trend === 'falling'
      ? 'bg-emerald-500/10 text-emerald-500'
      : 'bg-amber-500/10 text-amber-500';

  const numericValues = chartData
    .map(d => d.value)
    .filter(v => typeof v === 'number' && v > 0);

  if (!loading && numericValues.length < 2) {
    return <div className="no-data-signal hidden" />;
  }
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900/40 p-4 md:p-6 transition-colors duration-300">
      {/* Header Section */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center ${trendBadgeClass}`}>
            {getTrendIcon()}
            {trendLabel}
          </span>
          <span className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase">{indicatorCode}</span>
        </div>
        <h3 className="text-slate-900 dark:text-white text-lg md:text-xl font-bold leading-tight min-h-[4rem] flex items-center">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] md:text-xs mt-1 md:mt-2 leading-relaxed italic">{description}</p>
      </div>

      {/* Chart Visualization */}
      <div className="flex-1 min-h-[250px] md:min-h-[300px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorRisk-${indicatorCode}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 600 }}
              className="text-slate-400 dark:text-slate-500"
              minTickGap={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'currentColor', fontSize: 9 }}
              className="text-slate-400 dark:text-slate-500"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '11px'
              }}
              itemStyle={{ color: trendColor, fontWeight: 'bold', padding: 0 }}
              labelStyle={{ color: '#94a3b8', marginBottom: '2px' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={trendColor}
              strokeWidth={2}
              fill={`url(#colorRisk-${indicatorCode})`}
              activeDot={{ r: 5, fill: trendColor, stroke: '#fff', strokeWidth: 2 }}
              dot={false}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Guidance Footer */}
      <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
        <h4 className="text-slate-900 dark:text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full animate-ping ${trend === 'rising' ? 'bg-brand-red' : trend === 'falling' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          Traveler Guidance
        </h4>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-[11px] leading-snug">
          {trend === 'rising'
            ? "Caution: Upward trajectory detected. Ensure vaccinations are up to date and follow local safety advisories."
            : trend === 'falling'
              ? "Data shows a downward trend. Maintain standard hygiene protocols and verify local entry requirements."
              : "Data shows a stable trend. Maintain standard health precautions and check recent local advisories before travel."}
        </p>
      </div>
    </div>
  );
});

export default TrendChart;