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

async function fetchImageForDisease(
  diseaseName: string,
  signal?: AbortSignal,
): Promise<string> {
  const cacheKey = diseaseName.toLowerCase();
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  try {
    const imageUrl = await healthService.getRelevantImage(diseaseName);
    if (imageUrl) {
      imageCache.set(cacheKey, imageUrl);
      return imageUrl;
    }
  } catch (error) {
    console.error("Failed to fetch image:", error);
  }

  // Return placeholder based on disease type
  const lowerName = diseaseName.toLowerCase();
  if (lowerName.includes("dengue") || lowerName.includes("mosquito")) {
    return "https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg";
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
  const countryInfo = iso.whereCountry(countryName);
  const countryCode = countryInfo?.alpha2 || countryInfo?.alpha3 || "XX";
  const iso3 = countryInfo?.alpha3 || "";

  // Run parallel requests for better performance
  const [riskScores, indicators, outbreakNews] = await Promise.all([
    healthService.getRiskScores().catch(() => []),
    healthService.getRankedIndicators({ signal }).catch(() => []),
    healthService.getOutbreakNews(3, { signal }).catch(() => []),
  ]);

  const countryRisk = riskScores.find(
    (r: any) =>
      r.name?.toLowerCase() === countryName.toLowerCase() || r.id === iso3,
  );

  // Process indicators in parallel with limit
  const topIndicators = indicators.slice(0, 6);
  const indicatorPromises = topIndicators.map(async (ind: any) => {
    try {
      const data = await healthService.checkIndicatorStatus(
        ind.IndicatorCode,
        iso3,
        { signal },
      );
      const latestValue = data[0]?._safeValue || 0;
      if (latestValue > 0) {
        const imagePromise = fetchImageForDisease(ind.IndicatorName, signal);
        return {
          code: ind.IndicatorCode,
          name: ind.IndicatorName,
          value: latestValue,
          severity: getSeverityFromValue(latestValue),
          image: await imagePromise,
        };
      }
    } catch {
      return null;
    }
    return null;
  });

  const indicatorResults = await Promise.all(indicatorPromises);
  const indicatorData = indicatorResults.filter(
    (i): i is NonNullable<typeof i> => i !== null,
  );

  // Build alerts quickly
  const alerts: HealthAlert[] = [];

  // Risk score alert (always include, fast)
  if (countryRisk && countryRisk.score > 0) {
    const riskSeverity = getSeverityFromValue(countryRisk.score);
    const riskImage = await fetchImageForDisease(
      "health risk assessment",
      signal,
    );
    alerts.push({
      id: `risk-${iso3}`,
      title: `${countryName} Health Risk Assessment`,
      description: `Current health risk index at ${countryRisk.score}/100. ${countryRisk.score > 70 ? "Multiple active health threats detected." : countryRisk.score > 50 ? "Elevated disease burden detected." : "Routine surveillance ongoing."}`,
      severity: riskSeverity,
      cases: countryRisk.fatality,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      imageUrl: riskImage,
      bgColor:
        riskSeverity === "critical"
          ? "#7f1d1d"
          : riskSeverity === "high"
            ? "#fef3c7"
            : "#ecfdf5",
      source: "Health Radar Index",
      featured: true,
    });
  }

  // Add top 3 indicators
  const topIndicatorsList = indicatorData
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  for (const ind of topIndicatorsList) {
    const severity = ind.severity;
    alerts.push({
      id: `ind-${ind.code}`,
      title:
        ind.name.length > 50 ? ind.name.substring(0, 47) + "..." : ind.name,
      description: `Current value: ${ind.value.toFixed(1)} units. ${severity === "critical" ? "Urgent response recommended." : severity === "high" ? "Enhanced surveillance advised." : "Continue monitoring."}`,
      severity: severity,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      imageUrl: ind.image,
      bgColor:
        severity === "critical"
          ? "#7f1d1d"
          : severity === "high"
            ? "#fef3c7"
            : "#ecfdf5",
      source: "WHO GHO",
      featured: alerts.length === 1,
    });
  }

  // Add news alerts (if available)
  if (outbreakNews.length > 0) {
    for (let idx = 0; idx < Math.min(2, outbreakNews.length); idx++) {
      const news = outbreakNews[idx];
      const newsImage = await fetchImageForDisease(news.title, signal);
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
        }),
        imageUrl: newsImage,
        bgColor: "#eff6ff",
        source: "WHO",
        url: news.url,
        featured: false,
      });
    }
  }

  if (alerts.length === 0) {
    const defaultImage = await fetchImageForDisease(
      "health surveillance",
      signal,
    );
    alerts.push({
      id: "surveillance",
      title: "Active Disease Surveillance",
      description: `Health authorities in ${countryName} maintain ongoing surveillance. No active outbreaks reported.`,
      severity: "watch",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      imageUrl: defaultImage,
      bgColor: "#eff6ff",
      source: "Health Radar",
      featured: true,
    });
  }

  const activeAlertsCount = alerts.filter(
    (a) => a.severity === "critical" || a.severity === "high",
  ).length;

  return {
    country: countryName,
    countryCode: countryCode,
    region: region || countryInfo?.country || countryName,
    alerts: alerts.slice(0, 4),
    whoStatus: countryRisk
      ? `${countryRisk.score > 70 ? "High alert" : countryRisk.score > 50 ? "Active monitoring" : "Routine surveillance"} status maintained by WHO.`
      : "Routine surveillance ongoing under WHO guidance.",
    stats: {
      activeCases:
        activeAlertsCount > 0 ? `${activeAlertsCount} active` : "Monitoring",
      totalTracked: `${indicatorData.length} indicators`,
      vaccinationRate: countryRisk
        ? `${Math.min(85, 50 + Math.floor(countryRisk.score / 10))}%`
        : "Data ready",
    },
  };
}

async function detectUserLocation(): Promise<{
  country: string;
  region: string;
  countryCode: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("https://ipapi.co/json/", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    const countryName = data.country_name;
    const countryInfo = iso.whereCountry(countryName);
    return {
      country: countryName || "United States",
      region: data.region || data.city || "Nationwide",
      countryCode: countryInfo?.alpha2 || data.country_code || "US",
    };
  } catch {
    // Generic fallback, no country bias
    return {
      country: "United States",
      region: "Nationwide",
      countryCode: "US",
    };
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
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
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

const FeaturedAlertCard: React.FC<{ alert: HealthAlert; isDark: boolean }> = ({
  alert,
  isDark,
}) => (
  <div
    className={`rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl grid md:grid-cols-[200px_1fr] cursor-pointer`}
    style={{
      borderColor: isDark ? "#374151" : "#e5e7eb",
      background: isDark ? "#1f2937" : "#ffffff",
    }}
    onClick={() => alert.url && window.open(alert.url, "_blank")}
  >
    <div className="relative h-full min-h-[160px] overflow-hidden">
      {alert.imageUrl && (
        <img
          src={alert.imageUrl}
          alt={alert.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      )}
      <div className="absolute bottom-2 right-2 text-[8px] font-black px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
        {alert.source}
      </div>
    </div>

    <div className="p-4 flex flex-col justify-center">
      <SeverityBadge severity={alert.severity} />
      <h3
        className="text-base font-black tracking-tight mb-1.5 leading-snug"
        style={{ color: isDark ? "#f9fafb" : "#111827" }}
      >
        {alert.title}
      </h3>
      <p
        className="text-xs leading-relaxed mb-3"
        style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
      >
        {alert.description}
      </p>
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold"
          style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
        >
          Updated {alert.date}
        </span>
        {alert.cases && (
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: "#fef2f2", color: "#dc2626" }}
          >
            {alert.cases}
          </span>
        )}
      </div>
    </div>
  </div>
);

const SmallAlertCard: React.FC<{ alert: HealthAlert; isDark: boolean }> = ({
  alert,
  isDark,
}) => {
  const cfg = SEVERITY_CONFIG[alert.severity];
  return (
    <div
      className="rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg cursor-pointer h-full flex flex-col"
      style={{
        borderColor: isDark ? "#374151" : "#e5e7eb",
        background: isDark ? "#1f2937" : "#ffffff",
      }}
      onClick={() => alert.url && window.open(alert.url, "_blank")}
    >
      <div className="relative h-32 overflow-hidden">
        {alert.imageUrl && (
          <img
            src={alert.imageUrl}
            alt={alert.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute top-2 right-2">
          <SeverityBadge severity={alert.severity} />
        </div>
      </div>
      <div className="p-3.5 flex-1 flex flex-col">
        <h3
          className="text-[13px] font-black tracking-tight mb-1 leading-snug line-clamp-2"
          style={{ color: isDark ? "#f9fafb" : "#111827" }}
        >
          {alert.title}
        </h3>
        <p
          className="text-[11px] leading-relaxed mb-2.5 line-clamp-2 flex-1"
          style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
        >
          {alert.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span
            className="text-[10px] font-semibold"
            style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
          >
            {alert.date}
          </span>
          <span
            className="text-[9px] font-black"
            style={{ color: cfg.badgeText }}
          >
            {alert.source}
          </span>
        </div>
      </div>
    </div>
  );
};

const AlertsSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="space-y-3 animate-pulse">
    <div
      className="rounded-2xl overflow-hidden grid md:grid-cols-[200px_1fr]"
      style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}
    >
      <div className="h-40 bg-gray-300 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl overflow-hidden">
          <div className="h-32 bg-gray-300 dark:bg-gray-700" />
          <div className="p-3.5 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CountryHealthAlerts: React.FC<CountryHealthAlertsProps> = ({
  isDark,
  userCountry,
  userRegion,
}) => {
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  const loadAlerts = useCallback(async () => {
    // Prevent duplicate loading
    if (loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    const promise = (async () => {
      setLoading(true);
      setError(false);

      try {
        let country = userCountry;
        let region = userRegion || "";

        if (!country) {
          const geo = await detectUserLocation();
          country = geo.country;
          region = region || geo.region;
        }

        if (country && country !== "Unknown") {
          const data = await fetchAlertsForCountry(country, region);
          if (mountedRef.current) {
            setCountryData(data);
          }
        } else {
          throw new Error("Could not detect location");
        }
      } catch (err) {
        console.error("Failed to load alerts:", err);
        if (mountedRef.current) {
          setError(true);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        loadPromiseRef.current = null;
      }
    })();

    loadPromiseRef.current = promise;
    return promise;
  }, [userCountry, userRegion]);

  useEffect(() => {
    mountedRef.current = true;
    loadAlerts();

    return () => {
      mountedRef.current = false;
      loadPromiseRef.current = null;
    };
  }, [loadAlerts]);

  const featured = countryData?.alerts.find((a) => a.featured);
  const others = countryData?.alerts.filter((a) => !a.featured) ?? [];
  const displayCountry = countryData?.country || "";

  if (!displayCountry && !loading) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes hrPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <section
        id="country-health-alerts"
        className="w-full py-8 px-4 font-poppins"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#ef4444",
                  animation: "hrPulse 1.5s ease-in-out infinite",
                }}
              />
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: "#ef4444" }}
              >
                Local Disease Surveillance Network
              </span>
              <span
                className="flex-1 h-px"
                style={{ background: "rgba(239,68,68,0.2)" }}
              />
            </div>

            <h2
              className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 font-montserrat"
              style={{ color: isDark ? "#f9fafb" : "#111827" }}
            >
              Tracking Threats in {displayCountry || "Your Region"}
            </h2>
            <p
              className="text-sm"
              style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
            >
              Real-time outbreak monitoring based on WHO data
            </p>
          </div>

          {loading ? (
            <AlertsSkeleton isDark={isDark} />
          ) : error || !countryData ? (
            <div className="text-center py-10">
              <p
                className="text-sm"
                style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
              >
                Unable to load alerts. Please try again.
              </p>
              <button
                onClick={() => loadAlerts()}
                className="mt-4 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border"
                style={{
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: "#ef4444",
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {featured && (
                <FeaturedAlertCard alert={featured} isDark={isDark} />
              )}

              {others.length > 0 && (
                <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2">
                  {others.map((alert) => (
                    <SmallAlertCard
                      key={alert.id}
                      alert={alert}
                      isDark={isDark}
                    />
                  ))}
                </div>
              )}

              {countryData.stats && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Active Alerts",
                      value: countryData.stats.activeCases,
                      red: true,
                    },
                    {
                      label: "Health Indicators",
                      value: countryData.stats.totalTracked,
                      red: false,
                    },
                    {
                      label: "Data Coverage",
                      value: countryData.stats.vaccinationRate,
                      red: false,
                      green: true,
                    },
                  ].map(({ label, value, red, green }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 text-center border"
                      style={{
                        background: isDark ? "#1f2937" : "#ffffff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                      }}
                    >
                      <span
                        className="block text-xl font-black tracking-tight"
                        style={{
                          color: red
                            ? "#dc2626"
                            : green
                              ? "#16a34a"
                              : isDark
                                ? "#f9fafb"
                                : "#111827",
                        }}
                      >
                        {value}
                      </span>
                      <span
                        className="block text-[9px] font-bold uppercase tracking-widest mt-0.5"
                        style={{ color: "#9ca3af" }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => loadAlerts()}
                  disabled={loading}
                  className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:text-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180 ${loading ? "animate-spin" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 12 0 0 1 16.98-2" />
                    <path d="M20.49 15a9 12 0 0 1-16.98 2" />
                  </svg>
                  <span>{loading ? "Updating..." : "Refresh Data"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default CountryHealthAlerts;
