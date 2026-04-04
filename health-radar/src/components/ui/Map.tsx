import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapRef = {
  flyTo: (opts: maplibregl.FlyToOptions) => void;
  resize: () => void;
  getMap: () => MapLibreMap | null;
};

const MapContext = createContext<MapLibreMap | null>(null);

export const useMap = () => useContext(MapContext);

type MapProps = {
  children?: React.ReactNode;
  className?: string;
};

export const Map = forwardRef<MapRef, MapProps>(function Map(
  { children, className = "" },
  ref
) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (opts) => mapInstance.current?.flyTo(opts),
      resize: () => mapInstance.current?.resize(),
      getMap: () => mapInstance.current,
    }),
    []
  );

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [0, 18],
      zoom: 1.5,
      attributionControl: false,
      dragPan: true,
      scrollZoom: true,
      boxZoom: true,
      keyboard: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
      touchPitch: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      map.resize();
      setMapReady(map);
    });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => map.resize())
        : null;

    if (resizeObserver) {
      resizeObserver.observe(mapContainer.current);
    }

    const handleWindowResize = () => map.resize();
    window.addEventListener("resize", handleWindowResize);

    mapInstance.current = map;

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      resizeObserver?.disconnect();
      map.remove();
      mapInstance.current = null;
      setMapReady(null);
    };
  }, []);

  return (
    <MapContext.Provider value={mapReady}>
      <div className={`relative h-full w-full overflow-hidden ${className}`.trim()}>
        <div ref={mapContainer} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 z-10">{children}</div>
      </div>
    </MapContext.Provider>
  );
});

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  onClick?: () => void;
  children?: React.ReactNode;
};

export const MapMarker = ({ longitude, latitude, onClick, children }: MapMarkerProps) => {
  const map = useMap();
  const markerElRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map || !markerElRef.current) return;

    markerRef.current?.remove();

    const marker = new maplibregl.Marker({
      element: markerElRef.current,
      anchor: "bottom",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    const el = markerElRef.current;
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      onClick?.();
    };

    el.addEventListener("click", handleClick);

    return () => {
      el.removeEventListener("click", handleClick);
      marker.remove();
    };
  }, [map, longitude, latitude, onClick]);

  return (
    <div ref={markerElRef} className="pointer-events-auto select-none">
      {children}
    </div>
  );
};

export const MarkerContent = ({ children }: any) => <>{children}</>;
export const MarkerTooltip = ({ children }: any) => <>{children}</>;

export const MapControls = () => null;