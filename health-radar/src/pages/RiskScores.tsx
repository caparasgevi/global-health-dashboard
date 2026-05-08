import React, { useState, useEffect, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Search,
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Users,
  Activity,
  ShieldCheck,
  FileText,
  Calculator,
  Info,
  Microscope,
  Bug,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { healthService } from "../services/healthService";

const MOCK_AREA_DATA = [
  { name: "Week 1", cases: 4000 },
  { name: "Week 2", cases: 3000 },
  { name: "Week 3", cases: 5000 },
  { name: "Week 4", cases: 8000 },
  { name: "Week 5", cases: 12000 },
];

const RiskScores = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [timeOffset, setTimeOffset] = useState<number>(0); // 0 is Today, 14 is 2 weeks ago

  const [riskData, setRiskData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [countryStats, setCountryStats] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [endemicData, setEndemicData] = useState<any>({
    malaria: "N/A",
    tb: "N/A",
    cholera: "N/A",
  });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const pageVar = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  useEffect(() => {
    let isMounted = true;
    const fetchScores = async () => {
      setIsLoading(true);
      try {
        const data = await healthService.getRiskScores();
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setRiskData(data);
          } else {
            setRiskData([]);
          }
        }
      } catch (error) {
        if (isMounted) setRiskData([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchScores();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (selectedCountry) {
      setIsStatsLoading(true);
      const fetchDeepDive = async () => {
        const [stats, historyObj, malariaRes, choleraRes, tbRes] =
          await Promise.all([
            healthService.getLiveCountryStats(selectedCountry.id),
            healthService.getHistoricalData(selectedCountry.id),
            healthService.getEndemicData(
              selectedCountry.id,
              "MALARIA_EST_INCIDENCE",
            ),
            healthService.getEndemicData(
              selectedCountry.id,
              "CHOLERA_0000000001",
            ),
            healthService.getEndemicData(selectedCountry.id, "WHS3_62"),
          ]);

        if (isMounted) {
          setCountryStats(stats);

          if (historyObj) {
            const formattedHistory = Object.entries(historyObj).map(
              ([date, cases]) => ({
                name: date,
                cases: cases,
              }),
            );
            setHistoryData(formattedHistory);
          } else {
            setHistoryData([]);
          }

          const formatVal = (dataArr: any[]) =>
            dataArr[0]?.NumericValue
              ? Number(dataArr[0].NumericValue).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })
              : "N/A";

          setEndemicData({
            malaria: formatVal(malariaRes),
            cholera: formatVal(choleraRes),
            tb: formatVal(tbRes),
          });

          setIsStatsLoading(false);
        }
      };
      fetchDeepDive();
    } else {
      setCountryStats(null);
      setHistoryData([]);
      setEndemicData({ malaria: "N/A", tb: "N/A", cholera: "N/A" });
    }
    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  // THE TIME MACHINE ALGORITHM
  const filteredLeaderboard = useMemo(() => {
    // 1. Calculate the dynamic scores for ALL countries first
    let processed = riskData.map((country) => {
      let dynamicLivePenalty = country.metrics?.live || 0;
      let dynamicScore = country.score;
      let growthFactor = 1;
      let incidenceRate = 0;

      if (country.caseHistory && country.caseHistory.length >= 30) {
        const cases = country.caseHistory;

        const todayIdx = cases.length - 1 - timeOffset;
        const weekAgoIdx = todayIdx - 7;
        const twoWeeksAgoIdx = weekAgoIdx - 7;

        if (twoWeeksAgoIdx >= 0) {
          const casesToday = cases[todayIdx];
          const cases7DaysAgo = cases[weekAgoIdx];
          const cases14DaysAgo = cases[twoWeeksAgoIdx];

          const newCasesThisWeek = Math.max(casesToday - cases7DaysAgo, 0);
          const newCasesLastWeek = Math.max(cases7DaysAgo - cases14DaysAgo, 0);

          incidenceRate =
            (newCasesThisWeek / (country.population || 10000000)) * 100000;
          const incidenceNorm = Math.min((incidenceRate / 500) * 10, 10);

          if (newCasesLastWeek > 0) {
            growthFactor = newCasesThisWeek / newCasesLastWeek;
          }
          const growthNorm =
            growthFactor > 1.2 ? Math.min((growthFactor - 1) * 5, 10) : 0;

          dynamicLivePenalty = Math.round(incidenceNorm + growthNorm);

          const sys = country.metrics?.systemic || 0;
          const end = country.metrics?.endemic || 0;
          dynamicScore = Math.min(sys + end + dynamicLivePenalty, 100);
        }
      }

      return {
        ...country,
        score: dynamicScore,
        growthFactor,
        incidenceRate,
        metrics: { ...country.metrics, live: dynamicLivePenalty },
      };
    });

    // 2. Sort the FULL roster to establish the correct global order
    processed.sort((a, b) =>
      sortOrder === "desc" ? b.score - a.score : a.score - b.score,
    );

    // 3. Assign the true Global Rank (so a country keeps its rank even when searched)
    let ranked = processed.map((c, idx) => ({ ...c, globalRank: idx + 1 }));

    // 4. FINALLY, apply the search filter
    let filtered = ranked.filter((country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return filtered;
  }, [riskData, searchQuery, sortOrder, timeOffset]);

  return (
    <div
      id="risk-scores"
      className="py-8 md:py-12 bg-white dark:bg-slate-950 min-h-screen transition-colors duration-500"
    >
      <div className="max-w-7xl mx-auto px-4">
        <m.div
          initial="hidden"
          animate="visible"
          variants={pageVar}
          className="mb-6 md:mb-8 text-center md:text-left"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Risk <span className="text-brand-red">Score</span>
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium font-poppins">
            Calculating systemic threat through Static Health Baseline and
            Dynamic Outbreak Acceleration.
          </p>
        </m.div>

        <AnimatePresence mode="wait">
          {!selectedCountry ? (
            <m.div
              key="global-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Clock size={16} className="text-brand-red" /> Time Machine
                    Simulator
                  </h3>
                  <span className="text-brand-red font-bold text-[10px] md:text-xs bg-brand-red/10 px-4 py-1.5 rounded-full transition-all tracking-wider">
                    {timeOffset === 0
                      ? "LIVE DATA: TODAY"
                      : `REWIND: ${timeOffset} DAYS AGO`}
                  </span>
                </div>

                <input
                  type="range"
                  min="-14"
                  max="0"
                  step="1"
                  value={-timeOffset}
                  onChange={(e) => setTimeOffset(-Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-red"
                />

                <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest">
                  <span>2 Weeks Ago</span>
                  <span>1 Week Ago</span>
                  <span>Today</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search a country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand-red/20 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
                  />
                </div>

                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
                  }
                  className="w-full md:w-auto px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <ArrowUpDown
                    size={14}
                    className={
                      sortOrder === "desc"
                        ? "text-brand-red"
                        : "text-emerald-500"
                    }
                  />
                  {sortOrder === "desc"
                    ? "Highest Risk First"
                    : "Lowest Risk First"}
                </button>
              </div>

              <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border shadow-2xl transition-all duration-500 border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 p-6 md:p-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                      Threat Leaderboard
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Scores dynamically updated based on the Time Machine
                      timeline.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                        Running Threat Algorithm...
                      </p>
                    </div>
                  ) : (
                    <table className="w-full min-w-[500px] table-fixed text-left border-collapse relative">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-4 w-16 md:w-24 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Rank
                          </th>
                          <th className="pb-4 w-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Nation
                          </th>
                          <th className="pb-4 w-20 md:w-32 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Growth
                          </th>
                          <th className="pb-4 w-24 md:w-32 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Final Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {filteredLeaderboard.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-16 text-center">
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                                No Results Found
                              </p>
                              <p className="text-xs text-slate-500 italic">
                                No countries match "{searchQuery}"
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredLeaderboard.map((country) => (
                            <tr
                              key={country.id}
                              onClick={() => setSelectedCountry(country)}
                              className="group border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                            >
                              <td className="py-4 text-sm font-mono text-slate-500">
                                #{String(country.globalRank).padStart(2, "0")}
                              </td>
                              <td className="py-4 font-bold text-slate-900 dark:text-white group-hover:text-brand-red transition-colors truncate pr-4">
                                {country.name}
                              </td>
                              <td className="py-4 text-center">
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded ${
                                    country.growthFactor > 1.2
                                      ? "bg-red-500/10 text-brand-red"
                                      : "text-emerald-500"
                                  }`}
                                >
                                  {country.growthFactor
                                    ? country.growthFactor.toFixed(2)
                                    : "1.00"}
                                  x
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                                    country.score >= 75
                                      ? "bg-red-500/10 text-brand-red"
                                      : country.score >= 50
                                        ? "bg-orange-500/10 text-brand-orange"
                                        : "bg-emerald-500/10 text-emerald-500"
                                  }`}
                                >
                                  {country.score}/100
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </m.div>
          ) : (
            <m.div
              key="detail-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <button
                onClick={() => setSelectedCountry(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-brand-red text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={14} /> Back to Global View
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-slate-800 pb-8 gap-4">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {selectedCountry.name}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest shadow-sm ${
                        selectedCountry.score >= 75
                          ? "bg-brand-red text-white"
                          : selectedCountry.score >= 50
                            ? "bg-brand-orange text-white"
                            : "bg-emerald-500 text-white"
                      }`}
                    >
                      FINAL SCORE: {selectedCountry.score}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex gap-4 mt-2">
                    <span>
                      Dynamic Growth:{" "}
                      <strong
                        className={
                          selectedCountry.growthFactor > 1.2
                            ? "text-brand-red"
                            : "text-emerald-500"
                        }
                      >
                        {selectedCountry.growthFactor?.toFixed(2)}x
                      </strong>
                    </span>
                    <span>
                      Incidence:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {selectedCountry.incidenceRate?.toFixed(1)} per 100k
                      </strong>
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* 1. COVID-19 HEALTH DATABASE CARD */}
                <div className="theme-card rounded-3xl p-6 h-full flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" /> COVID-19
                    Health Database
                  </h3>

                  {isStatsLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center min-h-[12rem]">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                    </div>
                  ) : countryStats ? (
                    <div className="grid grid-cols-2 gap-4 flex-grow min-h-[12rem]">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                        <Users size={16} className="text-slate-400 mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Population
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {countryStats.population
                            ? countryStats.population.toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                        <FileText
                          size={16}
                          className="text-brand-orange mb-2"
                        />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Total Cases
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {countryStats.cases
                            ? countryStats.cases.toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                        <ShieldCheck
                          size={16}
                          className="text-emerald-500 mb-2"
                        />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Recovered
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {countryStats.recovered
                            ? countryStats.recovered.toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
                        <Activity size={16} className="text-brand-red mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Tests Administered
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {countryStats.tests
                            ? countryStats.tests.toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-400 text-sm italic font-medium min-h-[12rem]">
                      No health data available for this region.
                    </div>
                  )}
                </div>

                {/* 2. THE AREA CHART */}
                <div className="theme-card rounded-3xl p-6 h-full flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-brand-orange" />{" "}
                    COVID-19 Outbreak Acceleration
                  </h3>
                  <div className="flex-grow w-full relative min-h-[12rem]">
                    {isStatsLoading ? (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm rounded-xl">
                        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
                      </div>
                    ) : historyData.length === 0 ? (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center px-4">
                          Historical Data Unavailable
                        </p>
                      </div>
                    ) : null}

                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={
                          historyData.length > 0 ? historyData : MOCK_AREA_DATA
                        }
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorCases"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#E63946"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#E63946"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          strokeOpacity={0.1}
                        />
                        <XAxis dataKey="name" axisLine={false} tick={false} />
                        <YAxis
                          domain={["auto", "auto"]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#64748b" }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                          }}
                          labelStyle={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            marginBottom: "4px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cases"
                          stroke="#E63946"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorCases)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. ENDEMIC DISEASE SURVEILLANCE CARD */}
                <div className="theme-card rounded-3xl p-6 md:col-span-2 border-t-4 border-emerald-500/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Microscope size={16} className="text-emerald-500" />{" "}
                      Endemic Disease Surveillance
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">
                      WHO Official Records
                    </span>
                  </div>

                  {isStatsLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center min-h-[8rem]">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <Bug size={16} className="text-brand-orange mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Malaria Incidence
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {endemicData.malaria}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Cases per 1,000 population
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <Activity size={16} className="text-brand-red mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Tuberculosis Incidence
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {endemicData.tb}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Cases per 100,000 population
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <AlertTriangle
                          size={16}
                          className="text-amber-500 mb-2"
                        />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Cholera Outbreaks
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {endemicData.cholera}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Reported annual cases
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. ALGORITHM TRANSPARENCY & SOURCES CARD */}
                <div className="theme-card rounded-3xl p-6 md:col-span-2 border-t-4 border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Calculator size={16} className="text-brand-red" />{" "}
                      Algorithm Transparency
                    </h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row items-center justify-around gap-4 text-center">
                      {(() => {
                        const sysVal = selectedCountry.metrics?.systemic || 0;
                        const endVal = selectedCountry.metrics?.endemic || 0;
                        const livVal = selectedCountry.metrics?.live || 0;
                        const finalScoreVal = selectedCountry.score;

                        return (
                          <>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Systemic Infrastructure
                              </p>
                              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                                {sysVal}
                              </p>
                            </div>

                            <div className="text-slate-300 dark:text-slate-700 font-black text-xl">
                              +
                            </div>

                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Endemic Burden
                              </p>
                              <p className="text-2xl font-bold text-emerald-500">
                                {endVal}
                              </p>
                            </div>

                            <div className="text-slate-300 dark:text-slate-700 font-black text-xl">
                              +
                            </div>

                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Live Dynamic Penalty
                              </p>
                              <p className="text-2xl font-bold text-brand-red">
                                {livVal}
                              </p>
                            </div>

                            <div className="text-slate-300 dark:text-slate-700 font-black text-xl">
                              =
                            </div>

                            <div className="bg-white dark:bg-slate-950 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Final Score
                              </p>
                              <p className="text-3xl font-black text-brand-red">
                                {finalScoreVal}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-6 flex items-start gap-2 text-xs text-slate-400">
                    <Info size={14} className="mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      <strong>Data Sources & Methodology:</strong> The
                      Triple-Threat formula proxies{" "}
                      <span className="text-slate-500 dark:text-slate-300 font-medium">
                        Systemic Infrastructure
                      </span>{" "}
                      and{" "}
                      <span className="text-slate-500 dark:text-slate-300 font-medium">
                        Endemic Burden
                      </span>{" "}
                      directly from the Global Health Security (GHS) baseline.
                      The{" "}
                      <span className="text-slate-500 dark:text-slate-300 font-medium">
                        Live Dynamic Penalty
                      </span>{" "}
                      utilizes real-time telemetry from the open-source
                      disease.sh API to calculate a 7-day Incidence Rate per
                      100k population, combined with a weekly Growth Factor,
                      making it a leading indicator for rapidly accelerating
                      outbreaks.
                    </p>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RiskScores;
