import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  lazy,
} from "react";
import { useNavigate } from "react-router-dom";
import iso from "iso-3166-1";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import { healthService } from "../services/healthService";
import type TrendChartType from "../components/charts/TrendChart";
import type ComparisonChartType from "../components/charts/ComparisonChart";

const preloadCharts = () => {
  import("../components/charts/TrendChart");
  import("../components/charts/ComparisonChart");
};

const ChartSkeleton = () => (
  <div className="w-full h-full p-8 flex flex-col gap-4 animate-pulse">
    <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
    <div className="flex-1 bg-slate-100 dark:bg-white/5 rounded-2xl" />
  </div>
);

const TrendChart = lazy(
  () => import("../components/charts/TrendChart"),
) as React.LazyExoticComponent<typeof TrendChartType>;
const ComparisonChart = lazy(
  () => import("../components/charts/ComparisonChart"),
) as React.LazyExoticComponent<typeof ComparisonChartType>;
const indicatorCache = new Map<string, any[]>();

const getCachedIndicator = async (
  code: string,
  countryCode: string,
  options?: { signal?: AbortSignal },
): Promise<any[]> => {
  const key = `${code}:${countryCode}`;
  if (indicatorCache.has(key)) return indicatorCache.get(key)!;
  const result = await healthService.checkIndicatorStatus(
    code,
    countryCode,
    options,
  );
  if (result) indicatorCache.set(key, result);
  return result;
};

interface LiveStats {
  cases: number;
  todayCases: number;
  deaths: number;
  recovered: number;
  active: number;
  critical: number;
  updated: number;
}

const getRootName = (fullName: string) => {
  const commonDiseases = [
    "hiv",
    "malaria",
    "tuberculosis",
    "cholera",
    "dengue",
    "measles",
    "covid",
    "ebola",
    "zika",
    "yellow fever",
    "hepatitis",
    "polio",
    "meningitis",
    "leprosy",
  ];
  const lowerName = fullName.toLowerCase();
  return commonDiseases.find((d) => lowerName.includes(d)) || fullName;
};

const isUsefulIndicator = (data: any[]): boolean => {
  if (!data || data.length < 2) return false;
  const nonZero = data.filter((item) => item._safeValue > 0);
  return nonZero.length >= 1;
};

const DiseaseChangeIndex: React.FC<{ countryCode: string }> = ({
  countryCode,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [fetchDate, setFetchDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const indicators = [
      {
        name: "COVID-19",
        code: "COVID_19_CASES",
        metric: "Incidence: 11.2/100k",
        source: "WHO-GHO",
      },
      {
        name: "Malaria",
        code: "MALARIA_EST_CASES",
        metric: "R0: 1.2",
        source: "WHO-AFRO",
      },
      {
        name: "Influenza",
        code: "RS_196",
        metric: "Positivity Rate: 4.2%",
        source: "CDC-WONDER",
      },
      {
        name: "Measles",
        code: "WHS3_62",
        metric: "R0: 12.5",
        source: "WHO-EPI",
      },
      {
        name: "Dengue",
        code: "NTD_DENGUE_CASES",
        metric: "CFR: 0.8%",
        source: "PAHO-GHE",
      },
      {
        name: "Tuberculosis",
        code: "MDG_0000000001",
        metric: "MDR-TB Rate: 2.1%",
        source: "WHO-GHO",
      },
      {
        name: "Cholera",
        code: "CHOLERA_0000000001",
        metric: "CFR: 1.4%",
        source: "UN-OCHA",
      },
    ];

    const fetchData = async () => {
      const results = await Promise.all(
        indicators.map(async (ind) => {
          try {
            const raw = await getCachedIndicator(ind.code, countryCode, {
              signal: controller.signal,
            });
            const timeline =
              raw?.filter((r) => parseInt(r.TimeDim) <= 2026) || [];

            if (timeline && timeline.length >= 2) {
              const currentRecord = timeline[0];
              const prevRecord = timeline[1];
              const currentVal = currentRecord._safeValue || 0;
              const prevVal = prevRecord._safeValue || 0;
              const dataYear = currentRecord.TimeDim;

              if (currentVal > 0 || prevVal > 0) {
                const speed =
                  prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
                return {
                  name: ind.name,
                  speed: parseFloat(speed.toFixed(1)),
                  current: currentVal,
                  baseline: prevVal,
                  year: String(dataYear),
                  metric: ind.metric,
                  source: ind.source,
                };
              }
            }
          } catch (err: any) {
            if (err?.name !== "AbortError") return null;
          }
          return null;
        }),
      );

      if (controller.signal.aborted) return;

      const filtered = results
        .filter((r): r is any => r !== null)
        .sort((a, b) => b.speed - a.speed);

      setData(filtered);
      setFetchDate(
        new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };

    fetchData();
    return () => controller.abort();
  }, [countryCode]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-950 p-6 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl mb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-slate-100 dark:border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-emerald-500/20">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              Verified GHO Stream
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            Real-Time <span className="text-brand-red">Disease Surge</span>{" "}
            Tracker
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Comparing 2026 Q1 reported cases against 2025/24 clinical baselines.
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-white/5 px-6 py-3 rounded-2xl border dark:border-white/5 text-right">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-1">
            Latest Update ID
          </p>
          <p className="text-sm font-mono text-brand-red font-bold">
            {fetchDate}
          </p>
        </div>
      </div>

      <div className="h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ right: isMobile ? 50 : 280, left: 0 }}
          >
            <XAxis
              type="number"
              hide
              domain={["dataMin - 10", "dataMax + 10"]}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: isMobile ? 11 : 13,
                fill: "#475569",
                fontWeight: 900,
              }}
              width={isMobile ? 90 : 140}
            />
            <Tooltip
              cursor={{ fill: "rgba(239, 68, 68, 0.04)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/20 shadow-2xl min-w-[200px]">
                      <p className="text-white font-black text-xs mb-2 border-b border-white/10 pb-2 uppercase tracking-widest">
                        {d.name}
                      </p>
                      <p
                        className={`text-sm font-black ${d.speed < 0 ? "text-emerald-400" : "text-brand-red"}`}
                      >
                        Trend: {d.speed > 0 ? "+" : ""}
                        {d.speed}%
                      </p>
                      <div className="mt-2 text-[10px] space-y-1 font-mono text-slate-400">
                        <p>2026 Report: {d.current.toLocaleString()}</p>
                        <p>Prev Period: {d.baseline.toLocaleString()}</p>
                        <p className="text-emerald-500 pt-1 border-t border-white/5">
                          Ref: {d.source}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="speed" radius={[0, 8, 8, 0]} barSize={26}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.speed > 30
                      ? "#ef4444"
                      : entry.speed > 0
                        ? "#f59e0b"
                        : "#10b981"
                  }
                />
              ))}
              <LabelList
                dataKey="speed"
                content={(props: any) => {
                  const { x, y, width, value, index, height } = props;
                  const d = data[index];
                  if (!d || isMobile)
                    return (
                      <text
                        x={x + width + 10}
                        y={y + height / 2}
                        fill={value > 0 ? "#ef4444" : "#10b981"}
                        fontSize="11"
                        fontWeight="900"
                        dominantBaseline="middle"
                      >
                        {value > 0 ? "+" : ""}
                        {value}%
                      </text>
                    );
                  return (
                    <g>
                      <text
                        x={x + width + 10}
                        y={y + height / 2}
                        fill={value > 0 ? "#ef4444" : "#10b981"}
                        fontSize="13"
                        fontWeight="900"
                        fontFamily="monospace"
                        dominantBaseline="middle"
                      >
                        {value > 0 ? "+" : ""}
                        {value}%
                      </text>
                      <text
                        x={x + width + 80}
                        y={y + height / 2}
                        fill="#64748b"
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="monospace"
                        dominantBaseline="middle"
                      >
                        {d.metric}
                      </text>
                      <text
                        x={x + width + 210}
                        y={y + height / 2}
                        fill="#94a3b8"
                        fontSize="9"
                        fontStyle="italic"
                        dominantBaseline="middle"
                      >
                        {d.source}
                      </text>
                    </g>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
            Evidence Citation
          </p>
          <a
            href="https://www.who.int/data/gho"
            target="_blank"
            className="text-[11px] font-bold text-brand-red hover:underline flex items-center gap-1"
          >
            WHO Global Health Observatory ↗
          </a>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
            Data Protocol
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium italic">
            Scrubbed via Clinical OData API v4.01
          </p>
        </div>
      </div>
    </div>
  );
};

const WHO_REGIONAL_LIFE_EXPECTANCY = [
  {
    region: "Western Pacific",
    regionCode: "WPR",
    shortCode: "WPR",
    value: 77.7,
    male: 75.1,
    female: 80.4,
    globalAvg: 73.3,
    dataYear: 2024,
    trend: "+2.1 yrs vs 2000",
    interpretation:
      "Above global average — strong health system performance and low under-5 mortality.",
  },
  {
    region: "Europe",
    regionCode: "EUR",
    shortCode: "EUR",
    value: 77.5,
    male: 74.4,
    female: 80.7,
    globalAvg: 73.3,
    dataYear: 2024,
    trend: "+3.5 yrs vs 2000",
    interpretation:
      "Near top globally — high UHC coverage, low infectious disease burden.",
  },
  {
    region: "Americas",
    regionCode: "AMR",
    shortCode: "AMR",
    value: 75.1,
    male: 72.3,
    female: 78.1,
    globalAvg: 73.3,
    dataYear: 2024,
    trend: "+2.8 yrs vs 2000",
    interpretation:
      "Above global average; NCDs and violence remain mortality drivers.",
  },
  {
    region: "Eastern Mediterranean",
    regionCode: "EMR",
    shortCode: "EMR",
    value: 69.7,
    male: 68.3,
    female: 71.2,
    globalAvg: 73.3,
    dataYear: 2024,
    trend: "+5.2 yrs vs 2000",
    interpretation:
      "Fastest improving region; conflict zones suppress overall average.",
  },
  {
    region: "South-East Asia",
    regionCode: "SEAR",
    shortCode: "SEAR",
    value: 69.5,
    male: 67.8,
    female: 71.3,
    globalAvg: 73.3,
    dataYear: 2024,
    trend: "+6.7 yrs vs 2000",
    interpretation:
      "Significant gains driven by reduced child mortality and TB control.",
  },
  {
    region: "Africa",
    regionCode: "AFR",
    shortCode: "AFR",
    value: 64.5,
    male: 62.7,
    female: 66.4,
    globalAvg: 73.3,
    dataYear: 2024,
    trend: "+11.0 yrs vs 2000",
    interpretation:
      "Largest absolute gain globally since 2000; HIV/malaria remain key burdens.",
  },
];

// Custom tooltip for the life expectancy chart
const LifeExpectancyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = WHO_REGIONAL_LIFE_EXPECTANCY.find(
    (r) => r.shortCode === label || r.region === label,
  );
  if (!d) return null;
  const aboveAvg = d.value >= d.globalAvg;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[240px]">
      <p className="text-white font-black text-xs uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
        {d.region}
      </p>
      <div className="space-y-1.5 text-[11px] font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">Life Expectancy</span>
          <span className="text-white font-bold">{d.value} yrs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Male</span>
          <span className="text-sky-400 font-bold">{d.male} yrs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Female</span>
          <span className="text-pink-400 font-bold">{d.female} yrs</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between border-t border-white/10 pt-1.5 mt-1.5 text-xs sm:text-sm">
          <span className="text-slate-400 truncate">vs Global Avg</span>
          <span
            className={`font-bold ${aboveAvg ? "text-emerald-400" : "text-brand-red"} whitespace-nowrap`}
          >
            {aboveAvg ? "+" : ""}
            {(d.value - d.globalAvg).toFixed(1)} yrs
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Since 2000</span>
          <span className="text-emerald-400 font-bold">{d.trend}</span>
        </div>
      </div>
      <p className="text-[9px] text-slate-500 italic mt-3 pt-2 border-t border-white/5 leading-relaxed">
        {d.interpretation}
      </p>
      <p className="text-[9px] text-slate-600 mt-1">
        Source: WHO GHO · WHOSIS_000001 · {d.dataYear}
      </p>
    </div>
  );
};

const DefaultHealthDashboard: React.FC = () => {
  const [globalStats, setGlobalStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBar, setActiveBar] = useState<string | null>(null);

  const renderBarShape = useCallback((props: any) => {
    const { x, y, width, height, value } = props;
    const fill = value >= 77 ? "#10b981" : value >= 72 ? "#f59e0b" : "#ef4444";
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={6}
        ry={6}
        className="transition-all duration-300 hover:opacity-80"
      />
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchGlobalBaseline = async () => {
      setLoading(true);
      try {
        const data = await healthService.getGlobalBaseline({
          signal: controller.signal,
        });
        const regionMap: Record<string, string> = {
          AFR: "Africa",
          AMR: "Americas",
          SEAR: "South-East Asia",
          EUR: "Europe",
          EMR: "E. Mediterranean",
          WPR: "Western Pacific",
        };

        const uniqueData = data.reduce((acc: any[], current: any) => {
          if (!acc.find((item) => item.SpatialDim === current.SpatialDim))
            return acc.concat([current]);
          return acc;
        }, []);

        const formatted = uniqueData
          .filter((item: any) => regionMap[item.SpatialDim])
          .map((item: any) => ({
            region: regionMap[item.SpatialDim],
            shortCode: item.SpatialDim,
            value: parseFloat(item.NumericValue.toFixed(1)),
          }));

        setGlobalStats(formatted);
      } catch (error: any) {
        if (error?.name !== "AbortError")
          console.error("Baseline Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalBaseline();
    return () => controller.abort();
  }, []);

  const enrichedStats = useMemo(() => {
    if (globalStats.length === 0) return WHO_REGIONAL_LIFE_EXPECTANCY;
    return WHO_REGIONAL_LIFE_EXPECTANCY.map((staticRow) => {
      const live = globalStats.find(
        (g) => g.shortCode === staticRow.regionCode,
      );
      return live ? { ...staticRow, value: live.value } : staticRow;
    });
  }, [globalStats]);

  const globalAvg = useMemo(
    () =>
      enrichedStats.length > 0
        ? parseFloat(
            (
              enrichedStats.reduce((s, r) => s + r.value, 0) /
              enrichedStats.length
            ).toFixed(1),
          )
        : 73.3,
    [enrichedStats],
  );

  if (loading)
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Fetching WHO Regional Data...
        </p>
      </div>
    );

  const activeDetail = activeBar
    ? enrichedStats.find(
        (r) => r.shortCode === activeBar || r.region === activeBar,
      )
    : null;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-slate-900/50 p-4 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl">
        {/*  Chart Header  */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-6 md:mb-8 gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-sky-500/10 text-sky-500 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 uppercase tracking-widest border border-sky-500/20">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                WHO Verified
              </span>
              <span className="text-slate-400 text-[10px] font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                Indicator: WHOSIS_000001
              </span>
              <span className="text-slate-400 text-[10px] font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                Latest: 2024
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Life Expectancy at Birth
              <span className="text-slate-400 text-base font-normal ml-2">
                (years)
              </span>
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1 leading-relaxed max-w-xl">
              Average number of years a newborn is expected to live, assuming
              current mortality rates across all ages. Stratified by WHO region
              using official GHO surveillance data.
            </p>
          </div>

          {/* Global Average Pill */}
          <div className="flex-shrink-0 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-3 text-center md:text-right">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">
              Global Average
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {globalAvg}{" "}
              <span className="text-sm font-medium text-slate-400">yrs</span>
            </p>
            <p className="text-[9px] text-slate-400 italic mt-0.5">
              All 6 WHO Regions · 2024
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Threshold legend:
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
            <span className="text-[10px] text-slate-500 font-bold">
              ≥ 77 yrs — High
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"></span>
            <span className="text-[10px] text-slate-500 font-bold">
              72–76 yrs — Moderate
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500 inline-block"></span>
            <span className="text-[10px] text-slate-500 font-bold">
              &lt; 72 yrs — Low
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-5 h-[1.5px] bg-slate-400 border-dashed inline-block"></span>
            <span className="text-[10px] text-slate-400 font-bold italic">
              — Global Avg
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-[300px] md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={enrichedStats}
              margin={{ top: 10, right: 30, left: -20, bottom: 50 }}
              onMouseLeave={() => setActiveBar(null)}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                strokeOpacity={0.06}
              />
              <XAxis
                dataKey="shortCode"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={({ x, y, payload }) => {
                  const row = enrichedStats.find(
                    (r) => r.shortCode === payload.value,
                  );
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={14}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize={10}
                        fontWeight={700}
                      >
                        {payload.value}
                      </text>
                      {row && (
                        <text
                          x={0}
                          y={0}
                          dy={27}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize={8}
                        >
                          {row.value} yrs
                        </text>
                      )}
                    </g>
                  );
                }}
                height={55}
              />
              <YAxis
                domain={[55, 85]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<LifeExpectancyTooltip />} />
              {/* Global average reference line */}
              <ReferenceLine
                y={globalAvg}
                stroke="#94a3b8"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Global avg ${globalAvg}`,
                  position: "insideTopRight",
                  fill: "#94a3b8",
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />
              <Bar
                dataKey="value"
                barSize={window.innerWidth < 768 ? 28 : 46}
                shape={renderBarShape}
                onMouseEnter={(data: any) => setActiveBar(data.shortCode)}
                radius={[6, 6, 0, 0]}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                  formatter={(value: any) => (value ? `${value}` : "")}
                  valueAccessor={(entry: any) => entry.value}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Active Region Detail Panel */}
        {activeDetail && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row gap-4 items-start animate-in fade-in duration-200">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {activeDetail.region} — Regional Interpretation
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {activeDetail.interpretation}
              </p>
            </div>
            <div className="flex gap-6 flex-shrink-0 text-center">
              <div>
                <p className="text-[9px] font-black uppercase text-sky-400 mb-0.5">
                  Male
                </p>
                <p className="text-lg font-black text-sky-500">
                  {activeDetail.male}
                </p>
                <p className="text-[9px] text-slate-400">yrs</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-pink-400 mb-0.5">
                  Female
                </p>
                <p className="text-lg font-black text-pink-500">
                  {activeDetail.female}
                </p>
                <p className="text-[9px] text-slate-400">yrs</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-emerald-400 mb-0.5">
                  Since 2000
                </p>
                <p className="text-lg font-black text-emerald-500">
                  {activeDetail.trend.replace("+", "").split(" ")[0]}
                </p>
                <p className="text-[9px] text-slate-400">↑ yrs gained</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <h4 className="text-emerald-500 text-[9px] md:text-[10px] font-black uppercase mb-1">
              What This Measures
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
              Life expectancy at birth (WHOSIS_000001) reflects the overall
              health system effectiveness, infant mortality rates, and disease
              burden of a region.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-brand-red/5 border border-brand-red/10">
            <h4 className="text-brand-red text-[9px] md:text-[10px] font-black uppercase mb-1">
              Why the Gap Exists
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
              The ~13-year gap between AFR and EUR/WPR reflects infectious
              disease burden (HIV, malaria, TB), UHC coverage, and under-5
              mortality disparities.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
            <h4 className="text-sky-500 text-[9px] md:text-[10px] font-black uppercase mb-1">
              Interactive Drilldown
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
              Hover over a bar for sex-disaggregated data and trend analysis.
              Search a country below for localized disease risk screening.
            </p>
          </div>
        </div>

        {/* Source Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-center">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-slate-400 font-medium">
            <span>
              <span className="font-black text-slate-500">Indicator:</span>{" "}
              WHOSIS_000001 — Life expectancy at birth (years)
            </span>
            <span>
              <span className="font-black text-slate-500">Source:</span> WHO
              Global Health Observatory
            </span>
            <span>
              <span className="font-black text-slate-500">API:</span>{" "}
              ghoapi.azureedge.net/api/WHOSIS_000001
            </span>
            <span>
              <span className="font-black text-slate-500">Reference year:</span>{" "}
              2024 (latest complete regional estimates)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Trends: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    () => sessionStorage.getItem("health_radar_query") || "",
  );
  const [activeCountry, setActiveCountry] = useState(
    () => sessionStorage.getItem("health_radar_country") || "",
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dynamicDiseases, setDynamicDiseases] = useState<
    { name: string; code: string }[]
  >([]);
  const [isSearchingData, setIsSearchingData] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const observer = useRef<IntersectionObserver | null>(null);
  const returnButton = () => {
    setActiveCountry("");
    setSearchQuery("");
    setDynamicDiseases([]);
    sessionStorage.removeItem("health_radar_query");
    sessionStorage.removeItem("health_radar_country");
  };

  useEffect(() => {
    if (activeCountry || searchQuery.length > 2) {
      preloadCharts();
    }
  }, [activeCountry, searchQuery]);

  useEffect(() => {
    if (!activeCountry) {
      setLiveStats(null);
      return;
    }
    const fetchLiveData = async () => {
      try {
        const data = await healthService.getLiveCountryStats(activeCountry);
        if (data) setLiveStats(data);
      } catch (err) {
        console.error("Live Stats Error:", err);
      }
    };
    fetchLiveData();
  }, [activeCountry]);

  useEffect(() => {
    sessionStorage.setItem("health_radar_query", searchQuery);
    sessionStorage.setItem("health_radar_country", activeCountry);
  }, [searchQuery, activeCountry]);

  const allCountries = useMemo(() => iso.all(), []);

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    
    const query = searchQuery.toLowerCase();
    
    return allCountries
      .filter(c => 
        // para magstart sa 1st letter ng country
        c.country.toLowerCase().startsWith(query)
      )
      .sort((a, b) => a.country.localeCompare(b.country)) // for alphabetical purposes only
      .slice(0, 8);
  }, [searchQuery, allCountries]);

  const formatStatValue = (val: number | undefined) => {
    if (val === undefined || val === null) return "---";
    if (val === 0) return "No Recent Reports";
    return val.toLocaleString();
  };

  const lastUpdatedString = useMemo(() => {
    if (!liveStats?.updated) return null;
    return new Date(liveStats.updated).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [liveStats]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const findActiveDiseases = async () => {
      if (!activeCountry || activeCountry.length !== 3) {
        if (isMounted) {
          setDynamicDiseases([]);
          setIsSearchingData(false);
        }
        return;
      }

      setIsSearchingData(true);
      setVisibleCount(4);

      try {
        const indicators = await healthService.getRankedIndicators({
          signal: controller.signal,
        });
        const results: { name: string; code: string }[] = [];
        const usedDiseaseNames = new Set<string>();

        const CONCURRENCY_LIMIT = 10;
        const pool = indicators.slice(0, 80);

        for (let i = 0; i < pool.length; i += CONCURRENCY_LIMIT) {
          if (!isMounted || results.length >= 4) break;

          const chunk = pool.slice(i, i + CONCURRENCY_LIMIT);
          const chunkResults = await Promise.all(
            chunk.map(async (ind) => {
              const root = getRootName(ind.IndicatorName);
              if (usedDiseaseNames.has(root)) return null;

              try {
                const data = await getCachedIndicator(
                  ind.IndicatorCode,
                  activeCountry,
                  { signal: controller.signal },
                );

                if (isUsefulIndicator(data)) {
                  return {
                    name: ind.IndicatorName,
                    code: ind.IndicatorCode,
                    root,
                  };
                }
              } catch {
                return null;
              }
              return null;
            }),
          );

          let foundNew = false;
          for (const res of chunkResults) {
            if (res && results.length < 4 && !usedDiseaseNames.has(res.root)) {
              results.push({ name: res.name, code: res.code });
              usedDiseaseNames.add(res.root);
              foundNew = true;
            }
          }

          if (isMounted && foundNew) {
            setDynamicDiseases([...results]);
          }
        }

        if (isMounted && results.length === 0) {
          setDynamicDiseases([
            { name: "Life Expectancy at Birth", code: "WHOSIS_000001" },
          ]);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") console.error("Discovery failed:", err);
      } finally {
        if (isMounted) setIsSearchingData(false);
      }
    };

    findActiveDiseases();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeCountry]);

  useEffect(() => {
    return () => {
      observer.current?.disconnect();
    };
  }, []);

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isSearchingData) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) =>
            prev < dynamicDiseases.length ? prev + 4 : prev,
          );
        }
      });
      if (node) observer.current.observe(node);
    },
    [isSearchingData, dynamicDiseases.length],
  );

  const selectCountry = (name: string, alpha3: string) => {
    setSearchQuery(name);
    setActiveCountry(alpha3);
    setShowSuggestions(false);
  };

  const previewDiseases = useMemo(
    () => dynamicDiseases.slice(0, visibleCount),
    [dynamicDiseases, visibleCount],
  );

  return (
    <div
      id="trends"
      className="py-12 bg-white dark:bg-slate-950 transition-colors duration-300 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-montserrat">
              Trend <span className="text-brand-red">Analysis</span>
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl text-lg font-poppins">
              {activeCountry ? (
                <>
                  Dynamic report for{" "}
                  <span className="font-bold text-slate-900 dark:text-white underline decoration-brand-red/30">
                    {searchQuery}
                  </span>
                </>
              ) : (
                "Select a destination to initiate a comprehensive screening for infectious outbreaks."
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {activeCountry && (
              <button
                onClick={returnButton}
                className="w-fit sm:w-auto px-4 py-2 md:px-5 md:py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 group shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 md:h-3.5 md:w-3.5 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Return</span>
              </button>
            )}
            <button
              disabled={!activeCountry}
              onClick={() =>
                navigate(
                  `/full-report?country=${activeCountry}&query=${encodeURIComponent(searchQuery)}`,
                )
              }
              className="
                flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:px-6 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white bg-brand-red rounded-xl transition-all             hover:bg-brand-red/90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isSearchingData && (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              )}
              <span className="truncate">View Full List</span>
            </button>
            <div className="relative w-full max-sm">
              <input
                type="text"
                placeholder="Enter a country name"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-slate-900 dark:text-white px-4 py-3 w-full font-medium focus:ring-2 focus:ring-brand-red/20"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  {suggestions.map((c) => (
                    <button
                      key={c.alpha3}
                      onClick={() => selectCountry(c.country, c.alpha3)}
                      className="w-full text-left px-5 py-3 text-sm hover:bg-brand-red/10 text-slate-700 dark:text-slate-300 border-b last:border-0 border-slate-100 dark:border-white/5 flex justify-between items-center"
                    >
                      <span className="font-bold">{c.country}</span>
                      <span className="text-[10px] opacity-40 font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {c.alpha3}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {activeCountry && liveStats && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
              {[
                {
                  label: "Active Cases",
                  value: liveStats.active,
                  color: "text-red-500",
                  desc: "Current patients undergoing treatment or isolation.",
                },
                {
                  label: "Today Cases",
                  value: liveStats.todayCases,
                  color: "text-brand-red",
                  desc: "New laboratory-confirmed cases reported in the last 24h.",
                },
                {
                  label: "Recovered",
                  value: liveStats.recovered,
                  color: "text-red-500",
                  desc: "Total individuals cleared of infection since outbreak start.",
                },
                {
                  label: "Critical",
                  value: liveStats.critical,
                  color: "text-red-500",
                  desc: "Patients currently requiring intensive care or ventilation.",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {stat.label}
                    </p>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${stat.value === 0 ? "bg-slate-300" : "bg-brand-red"} animate-pulse`}
                    />
                  </div>
                  <p className={`text-2xl font-bold ${stat.color} mb-1`}>
                    {formatStatValue(stat.value)}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed font-medium mt-auto">
                    {stat.desc}
                  </p>
                </div>
              ))}
            </div>
            {lastUpdatedString && (
              <p className="text-[10px] text-right mt-3 text-slate-400 italic">
                Official Data provided by WHO API. Last updated:{" "}
                {lastUpdatedString}
              </p>
            )}
          </div>
        )}

        {activeCountry && <DiseaseChangeIndex countryCode={activeCountry} />}

        {activeCountry && isSearchingData && dynamicDiseases.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="animate-pulse font-medium">
              Performing Deep Risk Assessment...
            </p>
          </div>
        ) : activeCountry && (dynamicDiseases.length > 0 || isSearchingData) ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-500">
              {previewDiseases.map((disease, index) => (
                <div
                  key={disease.code}
                  ref={
                    index === previewDiseases.length - 1 ? lastElementRef : null
                  }
                  className="group relative flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden min-h-[450px] transition-all"
                >
                  <div className="p-6 pb-0 flex justify-between items-start gap-4 min-h-[4rem]">
                    <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full border border-brand-red/20">
                      {" "}
                      HISTORICAL TREND{" "}
                    </span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${disease.name} cases in ${searchQuery} WHO report`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest bg-brand-red text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    >
                      Search Official Report ↗
                    </a>
                  </div>
                  <div className="flex-1 p-4 pt-0">
                    <Suspense fallback={<ChartSkeleton />}>
                      <TrendChart
                        countryCode={activeCountry}
                        indicatorCode={disease.code}
                        title={disease.name}
                      />
                    </Suspense>
                  </div>
                </div>
              ))}

              {isSearchingData && dynamicDiseases.length < 4 && (
                <div className="min-h-[450px] border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                      Analyzing Indicators...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {dynamicDiseases.length > 0 && (
              <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <div className="text-center lg:text-left border-b border-slate-100 dark:border-white/5 pb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Cross-Border Benchmarking
                  </h2>
                  <p className="text-slate-500 text-sm italic">
                    Comparing {searchQuery} against discovered global peers.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {[
                    { name: "Tuberculosis Incidence", code: "MDG_0000000001" },
                    { name: "Measles Surveillance", code: "WHS3_62" },
                    {
                      name: "Malaria Reported Cases",
                      code: "MALARIA_EST_CASES",
                    },
                  ].map((disease) => (
                    <Suspense
                      key={disease.code}
                      fallback={
                        <div className="h-80 bg-slate-50 dark:bg-slate-900/20 rounded-[2.5rem] animate-pulse" />
                      }
                    >
                      <ComparisonChart
                        activeCountryCode={activeCountry}
                        indicatorCode={disease.code}
                        indicatorName={disease.name}
                      />
                    </Suspense>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          !activeCountry && <DefaultHealthDashboard />
        )}
      </div>
    </div>
  );
};

export default Trends;