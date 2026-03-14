import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { config } from "../config";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function UserLocationMarker() {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setPosition(null),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, []);

  if (!position) return null;
  const userIcon = L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
        <div class="pulse-ring" style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(13,166,242,0.35);"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#0da6f2;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);position:relative;z-index:2;"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
  return <Marker position={position} icon={userIcon} />;
}

/**
 * Draws a walking route polyline from the user's current GPS location to a
 * destination station. Uses the OSRM foot-routing API hosted by OpenStreetMap DE
 * to fetch a real pedestrian path (sidewalks, crossings, footpaths) rather than
 * a straight line. Also places a pulsing blue dot at the user's position.
 *
 * Re-fetches whenever `to` changes; cleans up the old route on unmount or
 * when a new destination is selected. A `cancelled` flag guards against
 * stale async responses writing to an already-cleaned-up map layer.
 *
 * @param {{ to: [number, number] | null }} props
 *   `to` – destination coordinates as [latitude, longitude], or null to clear.
 */
function RouteLine({ to }) {
  const map = useMap();
  const polylineRef = useRef(null);   // Leaflet polyline for the route
  const userMarkerRef = useRef(null); // Leaflet marker for the user's location dot

  useEffect(() => {
    // Remove any previously drawn route and user marker before drawing a new one
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (!to) return;

    // Guard against stale async callbacks after cleanup
    let cancelled = false;

    // Pulsing blue dot icon for the user's current position
    const userIcon = L.divIcon({
      className: "user-location-marker",
      html: `
        <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          <div class="pulse-ring" style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(13,166,242,0.35);"></div>
          <div style="width:16px;height:16px;border-radius:50%;background:#0da6f2;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);position:relative;z-index:2;"></div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    // Step 1: Get the user's current GPS coordinates via the browser Geolocation API
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const from = [pos.coords.latitude, pos.coords.longitude];

        // Step 2: Place a blue dot at the user's location on the map
        userMarkerRef.current = L.marker(from, { icon: userIcon, interactive: false }).addTo(map);

        // Step 3: Fetch the walking route from OSRM (foot profile).
        // OSRM expects coordinates as lng,lat; the response contains a GeoJSON
        // geometry with an array of [lng, lat] coordinate pairs tracing the path.
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return;
            if (!data.routes?.[0]?.geometry?.coordinates) return;

            // Step 4: Convert OSRM's [lng, lat] pairs to Leaflet's [lat, lng] format
            const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);

            // Step 5: Draw the route as a styled polyline on the map
            const line = L.polyline(coords, {
              color: "#0da6f2",
              weight: 5,
              opacity: 0.8,
              lineCap: "round",
            }).addTo(map);
            polylineRef.current = line;

            // Step 6: Auto-zoom the map to fit the entire route with padding
            map.fitBounds(line.getBounds(), { padding: [60, 60] });
          })
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );

    // Cleanup: remove drawn layers and mark async work as stale
    return () => {
      cancelled = true;
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    };
  }, [map, to?.[0], to?.[1]]); // Re-run when destination coordinates change

  return null;
}

function CenterOnUser({ mapRef }) {
  const map = useMap();
  const goToUser = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], map.getZoom()),
      () => {}
    );
  }, [map]);
  useEffect(() => {
    if (mapRef)
      mapRef.current = {
        goToUser,
        setView: (latlng) => map.setView(latlng, map.getZoom()),
      };
  }, [mapRef, goToUser]);
  return null;
}

/** When stations load or change, fit map bounds to show all stations (e.g. zoom to admin's managed stations). */
function FitBoundsToStations({ stations = [] }) {
  const map = useMap();
  const lastFittedKey = useRef(null);
  const points = useMemo(() => {
    return stations
      .map((s) => {
        const lat = s.location?.latitude;
        const lng = s.location?.longitude;
        return lat != null && lng != null ? [lat, lng] : null;
      })
      .filter(Boolean);
  }, [stations]);

  useEffect(() => {
    if (points.length === 0) return;
    const key = `${points.length}-${points[0]?.[0]}-${points[0]?.[1]}-${points[points.length - 1]?.[0]}-${points[points.length - 1]?.[1]}`;
    if (lastFittedKey.current === key) return;
    lastFittedKey.current = key;
    const bounds = L.latLngBounds(points);
    if (points.length === 1) {
      bounds.extend([points[0][0] + 0.005, points[0][1] + 0.005]);
      bounds.extend([points[0][0] - 0.005, points[0][1] - 0.005]);
    }
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [map, points]);

  return null;
}

export function StationMap({
  stations = [],
  selectedStationId,
  onSelectStation,
  mapRef,
  /** When true: markers are simple dots only (no availability badge, no popup). For active-rental map background. */
  simplified = false,
  /** [lat, lng] destination for route line (only used in active/simplified mode) */
  routeTo = null,
}) {
  const center = useMemo(
    () =>
      stations.length
        ? [
            stations.reduce((s, st) => s + (st.location?.latitude ?? 0), 0) / stations.length,
            stations.reduce((s, st) => s + (st.location?.longitude ?? 0), 0) / stations.length,
          ]
        : config.defaultCenter,
    [stations]
  );

  const tileConfig =
    config.mapTheme === "dark"
      ? {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }
      : config.mapTheme === "grayscale"
        ? {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }
        : {
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          };

  const mapContainerClass =
    config.mapTheme === "grayscale"
      ? "absolute inset-0 z-0 map-theme-grayscale"
      : "absolute inset-0 z-0";

  return (
    <div className={mapContainerClass}>
      <MapContainer
        center={center}
        zoom={config.defaultZoom}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        minZoom={3}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
        {/* Show live user marker in active/simplified mode too; RouteLine draws its own user dot while routing. */}
        {(!simplified || !routeTo) && <UserLocationMarker />}
        {routeTo && <RouteLine to={routeTo} />}
        <CenterOnUser mapRef={mapRef} />
        {stations.length > 0 && <FitBoundsToStations stations={stations} />}
        {stations.map((station) => {
          const lat = station.location?.latitude;
          const lng = station.location?.longitude;
          if (lat == null || lng == null) return null;
          const statusNorm = (station.status || "operational").toLowerCase().replace(/\s+/g, "_");
          const isNonOperational = statusNorm === "out_of_service" || statusNorm === "maintenance";
          const dotSize = simplified ? 24 : 18;
          const markerBoxSize = simplified ? dotSize + (isNonOperational ? 12 : 0) : 60;
          const available = station.numUmbrellas ?? 0;
          const capacity = station.capacity ?? 0;
          const isSelected = selectedStationId === station.stationId;
          const borderColor = isNonOperational ? "#dc2626" : "#0da6f2";
          const bgColor = isNonOperational ? "#fef2f2" : "#fff";
          const badgeText = `${available}/${capacity}`;
          const markerIcon = L.divIcon({
            className: "station-marker border-0 bg-transparent",
            html: simplified
              ? `
              <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${markerBoxSize}px;height:${markerBoxSize}px;cursor:pointer;">
                <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${isNonOperational ? "#fef2f2" : "#fff"};border:3px solid ${borderColor};box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>
                ${
                  isNonOperational
                    ? `<div style="position:absolute;top:0;right:0;width:18px;height:18px;border-radius:999px;background:#dc2626;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.2);">&#9881;</div>`
                    : ""
                }
              </div>
            `
              : `
              <div style="display:flex;flex-direction:column;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;background:${bgColor};color:${isNonOperational ? "#b91c1c" : "#0f172a"};font-weight:700;font-size:12px;padding:5px 10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);margin-bottom:5px;border:1px solid ${isNonOperational ? "#fecaca" : "#e2e8f0"};">
                  ${
                    isNonOperational
                      ? '<span style="font-size:15px;line-height:1;">&#9881;</span>'
                      : `<span>${badgeText}</span>`
                  }
                </div>
                <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${isSelected ? borderColor : isNonOperational ? "#fef2f2" : "#fff"};border:3px solid ${borderColor};box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>
              </div>
            `,
            iconSize: simplified ? [markerBoxSize, markerBoxSize] : [60, 42],
            iconAnchor: simplified ? [markerBoxSize / 2, markerBoxSize / 2] : [30, 42],
          });
          return (
            <Marker
              key={station.stationId}
              position={[lat, lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelectStation?.(station),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
