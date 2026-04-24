import React, { useEffect, useState, useCallback, useRef } from "react";
import iso from "iso-3166-1";
import { healthService } from "../services/healthService";

interface HealthAlert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "moderate" | "watch";
  cases?: string;
  date: string;
  imageUrl?: string;
  bgColor: string;
  source: string;
  featured?: boolean;
  url?: string;
}

interface CountryData {
  country: string;
  countryCode: string;
  region: string;
  alerts: HealthAlert[];
  whoStatus: string;
  stats: {
    activeCases: string;
    totalTracked: string;
    vaccinationRate: string;
  };
}

interface CountryHealthAlertsProps {
  isDark: boolean;
  userCountry?: string;
  userRegion?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical — Active Outbreak",
    dotColor: "#dc2626",
    badgeBg: "#fef2f2",
    badgeText: "#dc2626",
    animated: true,
  },
  high: {
    label: "High — Monitor",
    dotColor: "#ea580c",
    badgeBg: "#fff7ed",
    badgeText: "#ea580c",
    animated: true,
  },
  moderate: {
    label: "Moderate — Advisory",
    dotColor: "#ca8a04",
    badgeBg: "#fefce8",
    badgeText: "#ca8a04",
    animated: false,
  },
  watch: {
    label: "Watch — Informational",
    dotColor: "#2563eb",
    badgeBg: "#eff6ff",
    badgeText: "#2563eb",
    animated: false,
  },
};

const imageCache = new Map<string, string>();
const dataCache = new Map<string, CountryData>();

async function fetchImageForDisease(diseaseName: string): Promise<string> {
  const cacheKey = diseaseName.toLowerCase();
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;
  try {
    const imageUrl = await healthService.getRelevantImage(diseaseName);
    if (imageUrl) {
      imageCache.set(cacheKey, imageUrl);
      return imageUrl;
    }
  } catch (error) {
    console.error("Failed to fetch image:", error);
  }
  return "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg";
}

function getSeverityFromValue(value: number): HealthAlert["severity"] {
  if (value > 75) return "critical";
  if (value > 50) return "high";
  if (value > 25) return "moderate";
  return "watch";
}

async function fetchAlertsForCountry(
  countryName: string,
  region: string,
  signal?: AbortSignal,
): Promise<CountryData> {
  const cacheKey = `${countryName}-${region}`;
  if (dataCache.has(cacheKey)) return dataCache.get(cacheKey)!;

  const countryInfo = iso.whereCountry(countryName);
  const iso3 = countryInfo?.alpha3 || "";

  const [riskScores, indicators, outbreakNews] = await Promise.all([
    healthService.getRiskScores().catch(() => []),
    healthService.getRankedIndicators({ signal }).catch(() => []),
    healthService.getOutbreakNews(3, { signal }).catch(() => []),
  ]);

  const countryRisk = riskScores.find(
    (r: any) =>
      r.name?.toLowerCase() === countryName.toLowerCase() || r.id === iso3,
  );
  const topIndicators = indicators.slice(0, 6);

  const indicatorPromises = topIndicators.map(async (ind: any) => {
    try {
      const data = await healthService.checkIndicatorStatus(
        ind.IndicatorCode,
        iso3,
        { signal },
      );
      const filteredData = data.filter(
        (d: any) => d.TimeDimensionValue >= 2020,
      );
      const latestValue = filteredData[0]?._safeValue || 0;
      const actualYear = filteredData[0]?.TimeDimensionValue || "Recent";

      if (latestValue > 0) {
        return {
          code: ind.IndicatorCode,
          name: ind.IndicatorName,
          value: latestValue,
          severity: getSeverityFromValue(latestValue),
          image: await fetchImageForDisease(ind.IndicatorName),
          year: actualYear,
        };
      }
    } catch {
      return null;
    }
    return null;
  });

  const indicatorData = (await Promise.all(indicatorPromises)).filter(
    (i): i is NonNullable<typeof i> => i !== null,
  );
  const alerts: HealthAlert[] = [];

  if (countryRisk && countryRisk.score > 0) {
    const riskSeverity = getSeverityFromValue(countryRisk.score);
    alerts.push({
      id: `risk-${iso3}`,
      title: `${countryName} Health Risk Assessment`,
      description: `Current health risk index at ${countryRisk.score}/100. ${countryRisk.score > 70 ? "Multiple threats detected." : "Routine surveillance."}`,
      severity: riskSeverity,
      cases: countryRisk.fatality,
      date: countryRisk.lastUpdated
        ? new Date(countryRisk.lastUpdated).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "2026 Index",
      imageUrl: await fetchImageForDisease("health risk"),
      bgColor: "",
      source: "Health Radar Index",
      featured: true,
    });
  }

  indicatorData
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .forEach((ind) => {
      alerts.push({
        id: `ind-${ind.code}`,
        title: ind.name,
        description: `Surveillance data indicates a significant ${ind.name.toLowerCase()} presence, measured at a scale of ${ind.value.toFixed(1)} for recent observation periods.`,
        severity: ind.severity,
        date: `Data Year: ${ind.year}`,
        imageUrl: ind.image,
        bgColor: "",
        source: "WHO GHO",
        featured: alerts.length === 0,
      });
    });

  if (outbreakNews.length > 0) {
    for (let idx = 0; idx < Math.min(2, outbreakNews.length); idx++) {
      const news = outbreakNews[idx];
      alerts.push({
        id: `news-${Date.now()}-${idx}`,
        title:
          news.title.length > 50
            ? news.title.substring(0, 47) + "..."
            : news.title,
        description:
          news.summary?.substring(0, 120) || "Recent health incident reported.",
        severity: idx === 0 ? "high" : "moderate",
        date: new Date(news.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        imageUrl: await fetchImageForDisease(news.title),
        bgColor: "",
        source: "WHO",
        url: news.url,
        featured: false,
      });
    }
  }

  const activeAlertsCount = alerts.filter(
    (a) => a.severity === "critical" || a.severity === "high",
  ).length;
  const result = {
    country: countryName,
    countryCode: countryInfo?.alpha2 || "XX",
    region: region || countryName,
    alerts: alerts.slice(0, 4),
    whoStatus: "Surveillance ongoing.",
    stats: {
      activeCases:
        activeAlertsCount > 0 ? `${activeAlertsCount} active` : "Monitoring",
      totalTracked: `${indicatorData.length} indicators`,
      vaccinationRate: countryRisk
        ? `${Math.min(85, 50 + Math.floor(countryRisk.score / 10))}%`
        : "Data ready",
    },
  };

  dataCache.set(cacheKey, result);
  return result;
}

async function detectUserLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return {
      country: data.country_name || "United States",
      region: data.region || "Nationwide",
    };
  } catch {
    return { country: "United States", region: "Nationwide" };
  }
}

const SeverityBadge: React.FC<{ severity: HealthAlert["severity"] }> = ({
  severity,
}) => {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2"
      style={{ background: cfg.badgeBg, color: cfg.badgeText }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: cfg.dotColor,
          animation: cfg.animated
            ? "hrPulse 1.5s ease-in-out infinite"
            : "none",
        }}
      />
      {cfg.label}
    </span>
  );
};

const FeaturedAlertCard: React.FC<{ alert: HealthAlert }> = ({ alert }) => (
  <div
    className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-xl grid grid-cols-1 md:grid-cols-[320px_1fr] cursor-pointer"
    onClick={() => {
      const targetUrl =
        alert.url ||
        `https://www.google.com/search?q=${encodeURIComponent(alert.title + " WHO official report")}`;
      window.open(targetUrl, "_blank");
    }}
  >
    <div className="relative h-56 md:h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <img
        src={alert.imageUrl}
        alt={alert.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
      <div className="absolute bottom-3 left-3 text-[9px] font-black px-2.5 py-1 rounded-md bg-black/60 text-white backdrop-blur-md">
        {alert.source}
      </div>
    </div>
    <div className="p-6 flex flex-col justify-center">
      <div className="mb-3">
        <SeverityBadge severity={alert.severity} />
      </div>
      <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2 text-slate-900 dark:text-white leading-snug group-hover:text-brand-red transition-colors">
        {alert.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 md:line-clamp-3 leading-relaxed">
        {alert.description}
      </p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Report Date: {alert.date}
        </span>
      </div>
    </div>
  </div>
);

const SmallAlertCard: React.FC<{ alert: HealthAlert }> = ({ alert }) => (
  <div
    className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col"
    onClick={() => {
      const targetUrl =
        alert.url ||
        `https://www.google.com/search?q=${encodeURIComponent(alert.title + " WHO official report")}`;
      window.open(targetUrl, "_blank");
    }}
  >
    <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
      {/* FIXED: Using object-cover with aspect-video to fill space without stretching or cutting off primary central subjects */}
      <img
        src={alert.imageUrl}
        alt={alert.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-3 right-3">
        <SeverityBadge severity={alert.severity} />
      </div>
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <h3 className="text-sm font-black tracking-tight mb-2 line-clamp-2 text-slate-900 dark:text-white leading-snug group-hover:text-brand-red transition-colors">
        {alert.title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
        {alert.description}
      </p>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          {alert.date}
        </span>
        <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">
          {alert.source}
        </span>
      </div>
    </div>
  </div>
);

const AlertsSkeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  </div>
);

const CountryHealthAlerts: React.FC<CountryHealthAlertsProps> = ({
  userCountry,
  userRegion,
}) => {
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(false);
    const startTime = Date.now();
    try {
      let country = userCountry;
      let region = userRegion || "";
      if (!country) {
        const geo = await detectUserLocation();
        country = geo.country;
        region = geo.region;
      }
      const data = await fetchAlertsForCountry(
        country || "United States",
        region,
      );

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1200) {
        await new Promise((resolve) => setTimeout(resolve, 1200 - elapsedTime));
      }

      if (mountedRef.current) setCountryData(data);
    } catch (err) {
      if (mountedRef.current) setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userCountry, userRegion]);

  useEffect(() => {
    mountedRef.current = true;
    loadAlerts();
    return () => {
      mountedRef.current = false;
    };
  }, [loadAlerts]);

  const featured = countryData?.alerts.find((a) => a.featured);
  const others = countryData?.alerts.filter((a) => !a.featured) ?? [];
  const displayCountry = countryData?.country || "";

  return (
    <section
      id="country-health-alerts"
      className="w-full py-8 px-0 font-poppins"
    >
      <style>{`@keyframes hrPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-[hrPulse_1.5s_infinite]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">
              Local Disease Surveillance Network
            </span>
            <span className="flex-1 h-px bg-brand-red/20" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-montserrat tracking-tight">
            Tracking Threats in {displayCountry || "Your Region"}
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Real-time outbreak monitoring based on WHO data
          </p>
        </div>

        {loading ? (
          <AlertsSkeleton />
        ) : error || !countryData ? (
          <div className="text-center py-10">
            <button
              onClick={loadAlerts}
              className="text-brand-red font-bold uppercase text-[10px] tracking-widest hover:underline"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {featured && <FeaturedAlertCard alert={featured} />}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((alert) => (
                <SmallAlertCard key={alert.id} alert={alert} />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[
                {
                  label: "Active Alerts",
                  value: countryData.stats.activeCases,
                  color: "text-red-500 dark:text-red-400",
                },
                {
                  label: "Health Indicators",
                  value: countryData.stats.totalTracked,
                  color: "text-slate-900 dark:text-white",
                },
                {
                  label: "Data Coverage",
                  value: countryData.stats.vaccinationRate,
                  color: "text-emerald-500 dark:text-emerald-400",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-5 flex flex-col items-center justify-center text-center border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 min-h-[100px]"
                >
                  <span
                    className={`block text-3xl font-black tracking-tighter ${stat.color}`}
                  >
                    {stat.value}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CountryHealthAlerts;
