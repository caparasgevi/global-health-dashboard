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

interface MapProps {
  children?: React.ReactNode;
  className?: string;
  theme?: "light" | "dark";
}

const MAP_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

export const Map = forwardRef<MapRef, MapProps>(({ children, className = "", theme = "dark" }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (opts) => mapInstance.current?.flyTo(opts),
    resize: () => mapInstance.current?.resize(),
    getMap: () => mapInstance.current,
  }), []);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[theme],
      center: [20, 20],
      zoom: 1.8,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapReady(map);
      map.resize();
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setStyle(MAP_STYLES[theme]);
    }
  }, [theme]);

  return (
    <MapContext.Provider value={mapReady}>
      <div className={`relative h-full w-full ${className}`}>
        <style>{`
          .maplibregl-ctrl-group {
            background: ${theme === 'dark' ? '#0f172a !important' : '#ffffff !important'};
            border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
          }
          .maplibregl-ctrl-group button span {
            filter: ${theme === 'dark' ? 'invert(1)' : 'none'};
          }
        `}</style>
        
        <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {children}
        </div>
      </div>
    </MapContext.Provider>
  );
});

export const MapMarker = ({ longitude, latitude, onClick, children }: any) => {
  const map = useMap();
  const markerElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !markerElRef.current) return;
    const marker = new maplibregl.Marker({ element: markerElRef.current, anchor: "bottom" })
      .setLngLat([longitude, latitude]).addTo(map);
    return () => { marker.remove(); };
  }, [map, longitude, latitude]);

  return (
    <div ref={markerElRef} onClick={onClick} className="pointer-events-auto cursor-pointer">
      {children}
    </div>
  );
};

export const MarkerContent = ({ children }: any) => <>{children}</>;
export const MarkerTooltip = ({ children }: any) => <>{children}</>;
export const MapControls = () => null;