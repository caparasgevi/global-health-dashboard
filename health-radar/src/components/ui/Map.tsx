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
}

export const Map = forwardRef<MapRef, MapProps>(({ children, className = "" }, ref) => {
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
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
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
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      setTimeout(() => {
        map.resize();
        setMapReady(map);
      }, 100);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstance.current) {
        mapInstance.current.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    mapInstance.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstance.current = null;
      setMapReady(null);
    };
  }, []);

  return (
    <MapContext.Provider value={mapReady}>
      <div className={`relative w-full h-full min-h-[300px] bg-slate-100 dark:bg-slate-900 overflow-hidden ${className}`}>
        {/* Actual Map DOM Element */}
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* Layer for Markers/UI - Only renders once map is ready */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {mapReady && children}
        </div>
      </div>
    </MapContext.Provider>
  );
});

interface MapMarkerProps {
  longitude: number;
  latitude: number;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  longitude,
  latitude,
  onClick,
  children
}) => {
  const map = useMap();
  const markerElRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map || !markerElRef.current) return;

    const marker = new maplibregl.Marker({
      element: markerElRef.current,
      anchor: "bottom",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, longitude, latitude]);

  return (
    <div
      ref={markerElRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="pointer-events-auto cursor-pointer"
    >
      {children}
    </div>
  );
};


export const MarkerContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const MarkerTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const MapControls: React.FC = () => null; 