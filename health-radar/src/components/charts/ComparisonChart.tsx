import React, { useEffect, useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, Legend } from 'recharts';
import iso from 'iso-3166-1';
import { formatWHOData } from '../../utils/healthDataFormat';

interface ComparisonChartProps {
  activeCountryCode?: string;
}

const BENCHMARK_COUNTRIES = [
  { code: 'GBR', name: 'United Kingdom', color: '#38bdf8' }, 
  { code: 'SWE', name: 'Sweden',          color: '#fbbf24' } 
];

const INDICATOR = 'WHS3_62';

const ComparisonChart: React.FC<ComparisonChartProps> = ({ activeCountryCode }) => {
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const countries = useMemo(() => {
    const found    = activeCountryCode ? iso.whereAlpha3(activeCountryCode) : null;
    const dynEntry = activeCountryCode
      ? { code: activeCountryCode, name: found?.country ?? activeCountryCode, color: '#f43f5e' }
      : { code: 'PHL', name: 'Philippines', color: '#f43f5e' }; 
    return [dynEntry, ...BENCHMARK_COUNTRIES];
  }, [activeCountryCode]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const requests = countries.map(c => 
          fetch(
            `https://cors-anywhere.herokuapp.com/https://ghoapi.azureedge.net/api/${INDICATOR}?$format=json&$filter=SpatialDim eq '${c.code}'`,
            { signal: controller.signal }
          ).then(res => res.json())
        );

        const responses = await Promise.all(requests);
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
        if (error?.name !== 'AbortError') {
          console.error("Multi-fetch error:", error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => { isMounted = false; controller.abort(); };
  }, [countries]);

  if (loading) return (
    <div className="h-96 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/20 rounded-3xl border border-slate-200 dark:border-white/5 animate-pulse text-slate-500 dark:text-slate-400 font-mono">
      FETCHING GLOBAL COMPARATIVE DATA...
    </div>
  );

  return (
    <div className="w-full h-96 bg-white/50 dark:bg-slate-950/40 p-6 rounded-3xl border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-2xl transition-colors duration-300">
      <div className="mb-6">
        <h3 className="text-slate-900 dark:text-white text-xl font-bold">Global Comparative Outbreak Analysis</h3>
        <p className="text-slate-600 dark:text-slate-500 text-sm">Indicator: Annual Measles Surveillance</p>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-400 dark:text-slate-500" />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-400 dark:text-slate-500" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--tw-prose-invert-bg, #020617)', border: 'none', borderRadius: '12px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
          {countries.map(c => (
            <Line 
              key={c.code}
              type="monotone" 
              dataKey={c.code} 
              name={c.name}
              stroke={c.color} 
              strokeWidth={3} 
              dot={{ r: 4, fill: c.color }}
              activeDot={{ r: 8 }}
              connectNulls 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;
