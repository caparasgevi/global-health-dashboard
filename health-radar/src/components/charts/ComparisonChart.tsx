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
            `/gho-api/${INDICATOR}?$format=json&$filter=SpatialDim eq '${c.code}'`,
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
    <div className="h-[300px] md:h-[400px] flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/20 rounded-3xl border border-slate-200 dark:border-white/5 animate-pulse text-[10px] tracking-widest text-slate-500 font-mono">
      FETCHING COMPARATIVE DATA...
    </div>
  );

  return (
    <div className="w-full h-[350px] md:h-[450px] bg-white/50 dark:bg-slate-950/40 p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-2xl transition-colors duration-300">
      <div className="mb-4 md:mb-8">
        <h3 className="text-slate-900 dark:text-white text-lg md:text-xl font-bold tracking-tight">Global Comparative Analysis</h3>
        <p className="text-slate-500 text-xs font-medium">Measles Surveillance Index</p>
      </div>

      <div className="w-full h-[70%] md:h-[75%]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="8 8" 
              vertical={false} 
              stroke="currentColor" 
              className="text-slate-200 dark:text-white/5" 
            />
            <XAxis 
              dataKey="year" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 10 }} 
              className="text-slate-400 dark:text-slate-500"
              minTickGap={20} // Prevents overlapping years on small screens
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
                border: 'none', 
                borderRadius: '12px',
                fontSize: '11px',
                color: '#fff'
              }}
              itemStyle={{ padding: '2px 0' }}
              cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle" 
              wrapperStyle={{ 
                paddingTop: '24px', 
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 700
              }} 
            />
            {countries.map(c => (
              <Line 
                key={c.code}
                type="monotone" 
                dataKey={c.code} 
                name={c.name}
                stroke={c.color} 
                strokeWidth={2} // Slightly thinner for better mobile clarity
                dot={{ r: 3, fill: c.color, strokeWidth: 0 }}
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