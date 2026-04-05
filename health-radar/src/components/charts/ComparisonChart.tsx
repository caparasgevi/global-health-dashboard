import React, { useEffect, useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, Legend } from 'recharts';
import iso from 'iso-3166-1';
import { formatWHOData } from '../../utils/healthDataFormat';

interface ComparisonChartProps {
  activeCountryCode?: string;
  indicatorCode?: string;
  indicatorName?: string;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({
  activeCountryCode = 'PHL',
  indicatorCode = 'WHS3_62',
  indicatorName = 'Infectious Disease Surveillance'
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getBenchmarks = (code: string) => {
    // Normalize code for comparison
    const indicator = code.toUpperCase();

    if (indicator.includes('MDG_0000000001')) {
      return [
        { code: 'IND', name: 'India', color: '#38bdf8' },
        { code: 'IDN', name: 'Indonesia', color: '#fbbf24' }
      ];
    }

    if (indicator.includes('WHS3_62')) {
      return [
        { code: 'NGA', name: 'Nigeria', color: '#38bdf8' },
        { code: 'PAK', name: 'Pakistan', color: '#fbbf24' }
      ];
    }

    if (indicator.includes('MALARIA') || indicator.includes('WHS3_48')) {
      return [
        { code: 'COD', name: 'DR Congo', color: '#38bdf8' },
        { code: 'UGA', name: 'Uganda', color: '#fbbf24' }
      ];
    }

    return [
      { code: 'ZAF', name: 'South Africa', color: '#38bdf8' },
      { code: 'BRA', name: 'Brazil', color: '#fbbf24' }
    ];
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const countries = useMemo(() => {
    const found = iso.whereAlpha3(activeCountryCode);
    const activeEntry = {
      code: activeCountryCode,
      name: found?.country ?? activeCountryCode,
      color: '#f43f5e'
    };
    return [activeEntry, ...getBenchmarks(indicatorCode)];
  }, [activeCountryCode, indicatorCode]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const requests = countries.map(c =>
          fetch(
            `/gho-api/${indicatorCode}?$format=json&$filter=SpatialDim eq '${c.code}'`,
            { signal: controller.signal }
          ).then(res => res.json())
        );

        const responses = await Promise.all(
          requests.map(p => p.catch(e => {
            console.error("Single Country Fetch Fail:", e);
            return null; 
          }))
        );
        
        const yearlyData: any = {};

        responses.forEach((resData, index) => {
          const countryCode = countries[index].code;
          if (resData && resData.value) {
            const cleaned = formatWHOData(resData.value);
            cleaned.forEach((item: any) => {
              if (!yearlyData[item.year]) {
                yearlyData[item.year] = { year: item.year };
              }
              yearlyData[item.year][countryCode] = item.value;
            });
          }
        });

        if (isMounted) {
          setData(Object.values(yearlyData).sort((a: any, b: any) => a.year - b.year));
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') console.error("Triad Fetch Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => { isMounted = false; controller.abort(); };
  }, [countries, indicatorCode]);

  if (loading) return (
    <div className="h-[300px] md:h-[400px] flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/20 rounded-3xl border border-slate-200 dark:border-white/5 animate-pulse text-[10px] tracking-widest text-slate-500 font-mono">
      FETCHING BENCHMARK DATA...
    </div>
  );

  return (
    <div className="w-full h-[350px] md:h-[450px] bg-white/50 dark:bg-slate-950/40 p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-2xl transition-colors duration-300">
      <div className="mb-4 md:mb-8">
        <h3 className="text-slate-900 dark:text-white text-lg md:text-xl font-bold tracking-tight uppercase tracking-tighter">Comparative Analysis</h3>
        <p className="text-brand-red text-xs font-black uppercase tracking-widest">{indicatorName}</p>
      </div>

      <div className="w-full h-[70%] md:h-[75%]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-400 dark:text-slate-500" minTickGap={20} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-400 dark:text-slate-500" width={50} tickFormatter={formatYAxis} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} itemStyle={{ padding: '2px 0' }} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '24px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }} />
            {countries.map(c => (
              <Line
                key={c.code}
                type="monotone"
                dataKey={c.code}
                name={c.name}
                stroke={c.color}
                strokeWidth={c.code === activeCountryCode ? 3 : 2}
                dot={{ r: 3, fill: c.color, strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                connectNulls
                animationDuration={1500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparisonChart;