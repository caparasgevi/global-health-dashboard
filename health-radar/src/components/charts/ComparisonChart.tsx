import React, { useEffect, useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, Legend } from 'recharts';
import iso from 'iso-3166-1';
import { healthService } from '../../services/healthService';

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
          healthService.checkIndicatorStatus(indicatorCode, c.code, { signal: controller.signal })
        );

        const responses = await Promise.all(requests);
        
        const yearlyDataMap: Record<string, any> = {};

        responses.forEach((resData, index) => {
          const countryCode = countries[index].code;
          
          // Safety check for array returned from backend
          if (resData && Array.isArray(resData)) {
            resData.forEach((item: any) => {
              const year = item.TimeDim;
              const val = item._safeValue;
              
              if (!yearlyDataMap[year]) {
                yearlyDataMap[year] = { year: Number(year) };
              }
              yearlyDataMap[year][countryCode] = val;
            });
          }
        });

        if (isMounted) {
          const formattedData = Object.values(yearlyDataMap)
            .sort((a: any, b: any) => a.year - b.year);
          setData(formattedData);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError' && error?.name !== 'CanceledError') {
          console.error("Benchmark Fetch Error:", error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => { isMounted = false; controller.abort(); };
  }, [countries, indicatorCode]);

  if (loading) return (
    <div className="h-[450px] flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-300 dark:border-white/10 animate-pulse text-[10px] tracking-widest text-slate-500 font-mono">
      FETCHING BENCHMARK DATA...
    </div>
  );

  return (
    // FIXED: Container height must be a concrete value (px) or h-full within a fixed parent to avoid -1 Recharts warning
    <div className="w-full h-[450px] bg-white/50 dark:bg-slate-950/40 p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-2xl transition-colors duration-300 flex flex-col">
      <div className="mb-4">
        <h3 className="text-slate-900 dark:text-white text-lg md:text-xl font-bold tracking-tight uppercase">Comparative Analysis</h3>
        <p className="text-brand-red text-xs font-black uppercase tracking-widest">{indicatorName}</p>
      </div>

      <div className="flex-1 w-full min-h-0"> {/* min-h-0 is vital for ResponsiveContainer in Flexbox */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="8 8" vertical={false} strokeOpacity={0.1} />
            <XAxis 
              dataKey="year" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10 }} 
              tickFormatter={formatYAxis}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} 
              itemStyle={{ padding: '2px 0' }} 
            />
            <Legend 
              verticalAlign="bottom" 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '20px', fontSize: '9px', fontWeight: 800 }} 
            />
            {countries.map(c => (
              <Line
                key={c.code}
                type="monotone"
                dataKey={c.code}
                name={c.name}
                stroke={c.color}
                strokeWidth={c.code === activeCountryCode ? 4 : 2}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparisonChart;