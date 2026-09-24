"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { Button, buttonClassName } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { Surface } from "@/src/components/ui/Surface";
import { companySearchHref } from "@/src/lib/companySearchUrl";
import { ui } from "@/src/lib/uiStyles";

type BoundaryLayer = "regions" | "municipalities";

type MunicipalityFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
  properties: {
    id: string;
    kom_namn: string;
    lan_code?: string;
  };
};

type RegionFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
  properties: {
    l_id: number;
    name: string;
  };
};

type MunicipalityOption = {
  id: string;
  name: string;
  feature: MunicipalityFeature;
};

type RegionOption = {
  id: string;
  name: string;
  feature: RegionFeature;
};

type MapContextMenu = {
  x: number;
  y: number;
  label: string;
  code: string;
  href: string;
  type: "Kommun" | "Län";
};

const GRID_SOURCE = "map-grid";
const REGION_SOURCE = "sweden-regions";
const MUNICIPALITY_SOURCE = "sweden-municipalities";

const MAP_COLOR_TOKENS = {
  background: ["--app-map-background", "#111315"],
  grid: ["--app-map-grid", "#6e737c"],
  silhouette: ["--app-map-silhouette", "#6f7975"],
  regionFill: ["--app-map-region-fill", "#5eead4"],
  regionHover: ["--app-map-region-hover", "#5eead4"],
  regionSelected: ["--app-map-region-selected", "#f4f5f5"],
  municipalityFill: ["--app-map-municipality-fill", "#5eead4"],
  municipalityHover: ["--app-map-municipality-hover", "#5eead4"],
  municipalitySelected: ["--app-map-municipality-selected", "#f4f5f5"],
  municipalityLine: ["--app-map-municipality-line", "#5eead4"],
  regionLine: ["--app-map-region-line", "#5eead4"],
} as const;

type MapColors = { [Key in keyof typeof MAP_COLOR_TOKENS]: string };

function readMapColors(): MapColors {
  const styles = window.getComputedStyle(document.documentElement);

  return Object.fromEntries(
    Object.entries(MAP_COLOR_TOKENS).map(([key, [token, fallback]]) => [
      key,
      styles.getPropertyValue(token).trim() || fallback,
    ]),
  ) as MapColors;
}

function syncMapColors(map: MapLibreMap) {
  if (!map.isStyleLoaded()) return;

  const colors = readMapColors();
  const layers: Array<
    [string, "background-color" | "fill-color" | "line-color", string]
  > = [
    ["background", "background-color", colors.background],
    ["map-grid", "line-color", colors.grid],
    ["sweden-silhouette", "fill-color", colors.silhouette],
    ["region-fill", "fill-color", colors.regionFill],
    ["region-hover", "fill-color", colors.regionHover],
    ["region-selected", "fill-color", colors.regionSelected],
    ["municipality-fill", "fill-color", colors.municipalityFill],
    ["municipality-hover", "fill-color", colors.municipalityHover],
    ["municipality-selected", "fill-color", colors.municipalitySelected],
    ["municipality-line", "line-color", colors.municipalityLine],
    ["region-line", "line-color", colors.regionLine],
  ];

  for (const [layerId, property, color] of layers) {
    if (map.getLayer(layerId)) map.setPaintProperty(layerId, property, color);
  }
}

const SWEDEN_BOUNDS: [[number, number], [number, number]] = [
  [10.2, 55.0],
  [24.5, 69.2],
];

function geographicGrid() {
  const features: Array<{
    type: "Feature";
    properties: Record<string, never>;
    geometry: { type: "LineString"; coordinates: number[][] };
  }> = [];
  for (let longitude = -20; longitude <= 50; longitude += 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[longitude, 48], [longitude, 76]] },
    });
  }
  for (let latitude = 48; latitude <= 76; latitude += 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[-20, latitude], [50, latitude]] },
    });
  }
  return { type: "FeatureCollection" as const, features };
}

const GEOGRAPHIC_GRID = geographicGrid();

const EMPTY_MUNICIPALITY_FILTER: maplibregl.FilterSpecification = [
  "==",
  ["get", "id"],
  "",
];
const EMPTY_REGION_FILTER: maplibregl.FilterSpecification = [
  "==",
  ["get", "name"],
  "",
];

function LayerToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        buttonClassName({
          variant: active ? "accent" : "secondary",
          size: "sm",
          className: "font-semibold",
        }),
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function MapPanControls({ onPan }: { onPan: (x: number, y: number) => void }) {
  const controls = [
    { label: "Panorera uppåt", x: 0, y: -120, rotation: "-rotate-90" },
    { label: "Panorera åt vänster", x: -120, y: 0, rotation: "rotate-180" },
    { label: "Panorera åt höger", x: 120, y: 0, rotation: "" },
    { label: "Panorera nedåt", x: 0, y: 120, rotation: "rotate-90" },
  ];

  return (
    <div className="absolute right-2.5 top-[7rem] z-20 flex flex-col overflow-hidden rounded-md border border-app-border-strong bg-app-panel shadow-[var(--app-shadow-panel)]" aria-label="Panorera karta">
      {controls.map((control) => (
        <Button
          key={control.label}
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onPan(control.x, control.y)}
          aria-label={control.label}
          title={control.label}
          className="h-7 w-7 min-w-7 rounded-none p-0"
        >
          <MaskedIcon src="/icons/utility/arrow_right.svg" className={`h-3.5 w-3.5 ${control.rotation}`} />
        </Button>
      ))}
    </div>
  );
}

function setLayerVisibility(
  map: MapLibreMap,
  layerIds: string[],
  visible: boolean,
) {
  const visibility = visible ? "visible" : "none";

  for (const layerId of layerIds) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function featureName(
  feature: maplibregl.MapGeoJSONFeature,
  layer: BoundaryLayer,
) {
  if (layer === "regions") {
    return String(feature.properties?.name ?? "Region");
  }

  return String(feature.properties?.kom_namn ?? "Kommun");
}

function collectLngLatPairs(coordinates: unknown, pairs: [number, number][]) {
  if (!Array.isArray(coordinates)) return;

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    pairs.push([coordinates[0], coordinates[1]]);
    return;
  }

  for (const item of coordinates) {
    collectLngLatPairs(item, pairs);
  }
}

function boundsForFeature(feature: MunicipalityFeature | RegionFeature) {
  const pairs: [number, number][] = [];
  collectLngLatPairs(feature.geometry.coordinates, pairs);

  if (pairs.length === 0) return null;

  const bounds = new maplibregl.LngLatBounds(pairs[0], pairs[0]);
  for (const pair of pairs.slice(1)) {
    bounds.extend(pair);
  }

  return bounds;
}

function mapDuration(milliseconds: number) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : milliseconds;
}

function focusFeature(map: MapLibreMap, feature: MunicipalityFeature | RegionFeature) {
  const bounds = boundsForFeature(feature);
  if (!bounds) return;

  map.fitBounds(bounds, {
    padding: { top: 80, right: 80, bottom: 80, left: 80 },
    duration: mapDuration(900),
    bearing: 0,
    pitch: 0,
    maxZoom: 9.2,
  });
}

export function SwedenBoundaryMap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMunicipalityId = searchParams.get("municipality");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const selectMunicipalityRef = useRef<(option: MunicipalityOption) => void>(() => undefined);
  const selectRegionRef = useRef<(option: RegionOption) => void>(() => undefined);
  const regionsVisibleRef = useRef(false);
  const municipalitiesVisibleRef = useRef(true);
  const appliedMunicipalityParamRef = useRef<string | null>(null);
  const [regionsVisible, setRegionsVisible] = useState(false);
  const [municipalitiesVisible, setMunicipalitiesVisible] = useState(true);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([]);
  const [regionSearch, setRegionSearch] = useState("");
  const [municipalitySearch, setMunicipalitySearch] = useState("");
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [municipalityDropdownOpen, setMunicipalityDropdownOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] =
    useState<RegionOption | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] =
    useState<MunicipalityOption | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [contextMenu, setContextMenu] = useState<MapContextMenu | null>(null);
  const [copiedName, setCopiedName] = useState(false);
  const [status, setStatus] = useState("Laddar karta...");

  useEffect(() => {
    regionsVisibleRef.current = regionsVisible;
    municipalitiesVisibleRef.current = municipalitiesVisible;
  }, [municipalitiesVisible, regionsVisible]);

  const visibleRegions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase();
    if (!q) return regions;

    return regions.filter((region) => region.name.toLowerCase().includes(q));
  }, [regions, regionSearch]);

  const visibleMunicipalities = useMemo(() => {
    const q = municipalitySearch.trim().toLowerCase();
    if (!q) return municipalities;

    return municipalities
      .filter((municipality) =>
        municipality.name.toLowerCase().includes(q),
      );
  }, [municipalities, municipalitySearch]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapColors = readMapColors();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": mapColors.background,
            },
          },
        ],
      },
      center: [16.2, 62.4],
      zoom: 4.3,
      minZoom: 3.2,
      maxZoom: 10,
      renderWorldCopies: false,
      attributionControl: false,
    });

    map.doubleClickZoom.disable();
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }));
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    mapRef.current = map;

    const themeObserver = new MutationObserver(() => syncMapColors(map));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-color-theme"],
    });

    map.on("load", async () => {
      try {
        map.addSource(GRID_SOURCE, { type: "geojson", data: GEOGRAPHIC_GRID });
        map.addLayer({
          id: "map-grid",
          type: "line",
          source: GRID_SOURCE,
          paint: {
            "line-color": mapColors.grid,
            "line-opacity": 0.13,
            "line-width": 0.7,
          },
        });

        const [regionsGeoJson, municipalitiesGeoJson] = await Promise.all([
          fetch("/geojson/swedish_regions.geojson").then((res) => res.json()),
          fetch("/geojson/swedish_municipalities.geojson").then((res) =>
            res.json(),
          ),
        ]);

        const regionFeatures: RegionFeature[] = regionsGeoJson.features ?? [];
        const regionOptions = regionFeatures
          .map((feature) => ({
            id: String(feature.properties.l_id),
            name: feature.properties.name,
            feature,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "sv"));
        setRegions(regionOptions);

        const municipalityFeatures: MunicipalityFeature[] =
          municipalitiesGeoJson.features ?? [];
        const municipalityOptions = municipalityFeatures
          .map((feature) => ({
            id: feature.properties.id,
            name: feature.properties.kom_namn,
            feature,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "sv"));
        setMunicipalities(municipalityOptions);

        map.addSource(REGION_SOURCE, {
          type: "geojson",
          data: regionsGeoJson,
        });
        map.addSource(MUNICIPALITY_SOURCE, {
          type: "geojson",
          data: municipalitiesGeoJson,
        });

        map.addLayer({
          id: "sweden-silhouette",
          type: "fill",
          source: REGION_SOURCE,
          paint: {
            "fill-color": mapColors.silhouette,
            "fill-opacity": 1,
          },
        });

        map.addLayer({
          id: "region-fill",
          type: "fill",
          source: REGION_SOURCE,
          layout: { visibility: "none" },
          paint: {
            "fill-color": mapColors.regionFill,
            "fill-opacity": 0.05,
          },
        });

        map.addLayer({
          id: "region-hover",
          type: "fill",
          source: REGION_SOURCE,
          layout: { visibility: "none" },
          filter: EMPTY_REGION_FILTER,
          paint: {
            "fill-color": mapColors.regionHover,
            "fill-opacity": 0.18,
          },
        });

        map.addLayer({
          id: "region-selected",
          type: "fill",
          source: REGION_SOURCE,
          layout: { visibility: "none" },
          filter: EMPTY_REGION_FILTER,
          paint: {
            "fill-color": mapColors.regionSelected,
            "fill-opacity": 0.2,
          },
        });

        map.addLayer({
          id: "municipality-fill",
          type: "fill",
          source: MUNICIPALITY_SOURCE,
          layout: { visibility: "none" },
          paint: {
            "fill-color": mapColors.municipalityFill,
            "fill-opacity": 0.13,
          },
        });

        map.addLayer({
          id: "municipality-hover",
          type: "fill",
          source: MUNICIPALITY_SOURCE,
          layout: { visibility: "none" },
          filter: EMPTY_MUNICIPALITY_FILTER,
          paint: {
            "fill-color": mapColors.municipalityHover,
            "fill-opacity": 0.18,
          },
        });

        map.addLayer({
          id: "municipality-selected",
          type: "fill",
          source: MUNICIPALITY_SOURCE,
          layout: { visibility: "none" },
          filter: EMPTY_MUNICIPALITY_FILTER,
          paint: {
            "fill-color": mapColors.municipalitySelected,
            "fill-opacity": 0.22,
          },
        });

        map.addLayer({
          id: "municipality-line",
          type: "line",
          source: MUNICIPALITY_SOURCE,
          layout: { visibility: "none" },
          paint: {
            "line-color": mapColors.municipalityLine,
            "line-opacity": 0.48,
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              3,
              0.35,
              6,
              0.8,
              9,
              1.3,
            ],
          },
        });

        map.addLayer({
          id: "region-line",
          type: "line",
          source: REGION_SOURCE,
          layout: { visibility: "none" },
          paint: {
            "line-color": mapColors.regionLine,
            "line-opacity": 0.82,
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              3,
              1.2,
              6,
              1.8,
              9,
              2.6,
            ],
          },
        });

        function showPopup(layer: BoundaryLayer) {
          return (event: maplibregl.MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            if (!feature) return;

            map.getCanvas().style.cursor = "pointer";
            popupRef.current?.remove();

            if (layer === "municipalities") {
              const id = String(feature.properties?.id ?? "");
              map.setFilter("municipality-hover", [
                "==",
                ["get", "id"],
                id,
              ]);
            } else if (!municipalitiesVisibleRef.current) {
              const name = String(feature.properties?.name ?? "");
              map.setFilter("region-hover", [
                "==",
                ["get", "name"],
                name,
              ]);
            }

            popupRef.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 12,
              className: "clean-map-popup",
            })
              .setLngLat(event.lngLat)
              .setHTML(
                [
                  "<div>",
                  escapeHtml(featureName(feature, layer)),
                  "</div>",
                ].join(""),
              )
              .addTo(map);
          };
        }

        function hidePopup(layer: BoundaryLayer) {
          map.getCanvas().style.cursor = "";
          popupRef.current?.remove();
          popupRef.current = null;

          if (layer === "municipalities") {
            map.setFilter("municipality-hover", EMPTY_MUNICIPALITY_FILTER);
          } else {
            map.setFilter("region-hover", EMPTY_REGION_FILTER);
          }
        }

        map.on("mousemove", "region-fill", showPopup("regions"));
        map.on("mouseleave", "region-fill", () => hidePopup("regions"));
        map.on("mousemove", "municipality-fill", showPopup("municipalities"));
        map.on("mouseleave", "municipality-fill", () =>
          hidePopup("municipalities"),
        );
        function boundaryAt(point: maplibregl.MapMouseEvent["point"]) {
          if (municipalitiesVisibleRef.current) {
            const feature = map.queryRenderedFeatures(point, {
              layers: ["municipality-fill"],
            })[0];
            if (feature) return { feature, type: "Kommun" as const };
          }
          if (regionsVisibleRef.current) {
            const feature = map.queryRenderedFeatures(point, {
              layers: ["region-fill"],
            })[0];
            if (feature) return { feature, type: "Län" as const };
          }
          return null;
        }

        map.on("dragstart", () => setContextMenu(null));
        map.on("click", (event) => {
          const boundary = boundaryAt(event.point);
          if (!boundary || !containerRef.current) {
            setContextMenu(null);
            return;
          }
          const { feature, type } = boundary;

          const rect = containerRef.current.getBoundingClientRect();
          const x = Math.max(8, Math.min(event.point.x + 8, rect.width - 216));
          const y = Math.max(8, Math.min(event.point.y + 8, rect.height - 156));
          popupRef.current?.remove();
          setCopiedName(false);

          if (type === "Kommun") {
            const id = String(feature.properties?.id ?? "");
            const name = String(feature.properties?.kom_namn ?? "Kommun");
            setContextMenu({
              x,
              y,
              label: name,
              code: id,
              href: `/municipality/${encodeURIComponent(id)}`,
              type,
            });
            return;
          }

          const regionId = String(feature.properties?.l_id ?? "").padStart(
            2,
            "0",
          );
          const name = String(feature.properties?.name ?? "Region");
          setContextMenu({
            x,
            y,
            label: name,
            code: regionId,
            href: `/county/${encodeURIComponent(regionId)}`,
            type,
          });
        });

        map.on("dblclick", (event) => {
          event.preventDefault();
          setContextMenu(null);
          popupRef.current?.remove();
          const boundary = boundaryAt(event.point);
          if (!boundary) return;

          if (boundary.type === "Kommun") {
            const id = String(boundary.feature.properties?.id ?? "");
            const option = municipalityOptions.find((item) => item.id === id);
            if (option) window.requestAnimationFrame(() => selectMunicipalityRef.current(option));
            return;
          }

          const id = String(boundary.feature.properties?.l_id ?? "");
          const option = regionOptions.find((item) => item.id === id);
          if (option) window.requestAnimationFrame(() => selectRegionRef.current(option));
        });

        map.fitBounds(SWEDEN_BOUNDS, { padding: 28, duration: 0 });
        syncMapColors(map);
        setMapReady(true);
        setStatus("Karta redo");
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Kartan kunde inte laddas",
        );
      }
    });

    return () => {
      themeObserver.disconnect();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    setLayerVisibility(
      map,
      ["region-fill", "region-line", "region-hover", "region-selected"],
      regionsVisible,
    );
    if (map.getLayer("region-fill")) {
      map.setPaintProperty(
        "region-fill",
        "fill-opacity",
        municipalitiesVisible ? 0.07 : 0.18,
      );
    }
  }, [mapReady, municipalitiesVisible, regionsVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    setLayerVisibility(
      map,
      [
        "municipality-fill",
        "municipality-line",
        "municipality-hover",
        "municipality-selected",
      ],
      municipalitiesVisible,
    );
    if (map.getLayer("municipality-fill")) {
      map.setPaintProperty("municipality-fill", "fill-opacity", 0.13);
    }
  }, [mapReady, municipalitiesVisible, regionsVisible]);

  function selectMunicipality(municipality: MunicipalityOption) {
    const map = mapRef.current;
    setSelectedRegion(null);
    setSelectedMunicipality(municipality);
    setMunicipalitySearch(municipality.name);
    setMunicipalityDropdownOpen(false);
    setMunicipalitiesVisible(true);
    municipalitiesVisibleRef.current = true;

    if (!map?.getLayer("municipality-selected")) return;

    setLayerVisibility(
      map,
      [
        "municipality-fill",
        "municipality-line",
        "municipality-hover",
        "municipality-selected",
      ],
      true,
    );
    if (map.getLayer("region-fill")) {
      map.setPaintProperty("region-fill", "fill-opacity", 0.04);
    }
    map.setFilter("region-selected", EMPTY_REGION_FILTER);
    map.setFilter("municipality-selected", [
      "==",
      ["get", "id"],
      municipality.id,
    ]);
    map.setBearing(0);
    map.setPitch(0);
    focusFeature(map, municipality.feature);
  }

  function selectRegion(region: RegionOption) {
    const map = mapRef.current;
    setSelectedMunicipality(null);
    setSelectedRegion(region);
    setRegionSearch(region.name);
    setRegionDropdownOpen(false);
    setRegionsVisible(true);

    if (!map?.getLayer("region-selected")) return;

    setLayerVisibility(
      map,
      ["region-fill", "region-line", "region-hover", "region-selected"],
      true,
    );
    if (map.getLayer("region-fill")) {
      map.setPaintProperty(
        "region-fill",
        "fill-opacity",
        municipalitiesVisibleRef.current ? 0.04 : 0.18,
      );
    }
    map.setFilter("municipality-selected", EMPTY_MUNICIPALITY_FILTER);
    map.setFilter("region-selected", [
      "==",
      ["get", "name"],
      region.name,
    ]);
    map.setBearing(0);
    map.setPitch(0);
    focusFeature(map, region.feature);
  }

  useEffect(() => {
    selectMunicipalityRef.current = selectMunicipality;
    selectRegionRef.current = selectRegion;
  });

  useEffect(() => {
    if (!mapReady || !requestedMunicipalityId || municipalities.length === 0) {
      return;
    }
    if (appliedMunicipalityParamRef.current === requestedMunicipalityId) {
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    const municipality = municipalities.find(
      (item) => item.id === requestedMunicipalityId,
    );
    if (!municipality) return;

    const applyMunicipalityFocus = () => {
      if (!map.isStyleLoaded() || !map.getLayer("municipality-selected")) {
        return;
      }

      selectMunicipality(municipality);
      appliedMunicipalityParamRef.current = requestedMunicipalityId;
    };

    if (map.isStyleLoaded() && map.getLayer("municipality-selected")) {
      window.requestAnimationFrame(applyMunicipalityFocus);
      return;
    }

    map.once("idle", applyMunicipalityFocus);

    return () => {
      map.off("idle", applyMunicipalityFocus);
    };
  }, [mapReady, municipalities, requestedMunicipalityId]);

  function clearFocus() {
    const map = mapRef.current;
    setSelectedMunicipality(null);
    setSelectedRegion(null);
    setMunicipalitySearch("");
    setRegionSearch("");

    if (map?.isStyleLoaded()) {
      map.setFilter("municipality-selected", EMPTY_MUNICIPALITY_FILTER);
      map.setFilter("region-selected", EMPTY_REGION_FILTER);
      map.fitBounds(SWEDEN_BOUNDS, { padding: 28, duration: mapDuration(700), bearing: 0 });
    }
  }

  async function copyContextName() {
    if (!contextMenu) return;
    try {
      await navigator.clipboard.writeText(contextMenu.label);
      setCopiedName(true);
    } catch {
      setCopiedName(false);
    }
  }

  return (
    <Surface
      padding="none"
      className="overflow-hidden rounded-none border-0"
    >
      <div className="grid h-[calc(100dvh-3rem-1px)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_17rem] lg:grid-rows-1">
        <div className="relative min-h-[320px] lg:h-full lg:min-h-0">
          <div ref={containerRef} className="h-full w-full" />
          <MapPanControls onPan={(x, y) => mapRef.current?.panBy([x, y], { duration: mapDuration(250) })} />
          <Button
            type="button"
            onClick={clearFocus}
            variant="secondary"
            size="icon"
            className="absolute left-3 top-3 z-20 h-7 min-w-7 bg-app-panel p-0 shadow-[var(--app-shadow-panel)]"
            aria-label="Återställ kartvy"
            title="Återställ kartvy"
          >
            <MaskedIcon src="/icons/menu/house-chimney-blank-svgrepo-com.svg" />
          </Button>
          {contextMenu ? (
            <div
              className="absolute z-30 min-w-52 overflow-hidden rounded-md border border-app-border bg-app-panel shadow-[var(--app-shadow-float)]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
            >
              <div className="border-b border-app-border px-3 py-2">
                <div className="text-xs font-medium uppercase text-app-text-subtle">
                  {contextMenu.type}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-app-text">
                  {contextMenu.label}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const href = contextMenu.href;
                  setContextMenu(null);
                  router.push(href);
                }}
                className={[ui.selectMenuOption, "font-medium text-app-text-muted hover:bg-app-panel-hover-soft hover:text-app-text"].join(" ")}
              >
                Gå till {contextMenu.type.toLowerCase()}
              </button>
              <button
                type="button"
                onClick={() => {
                  const href = companySearchHref(contextMenu.type === "Län"
                    ? { county_codes: [contextMenu.code] }
                    : { municipality_codes: [contextMenu.code] });
                  setContextMenu(null);
                  router.push(href);
                }}
                className={[ui.selectMenuOption, "font-medium text-app-text-muted hover:bg-app-panel-hover-soft hover:text-app-text"].join(" ")}
              >
                Företag i {contextMenu.label}
              </button>
              <button
                type="button"
                onClick={() => void copyContextName()}
                className={[ui.selectMenuOption, "font-medium text-app-text-muted hover:bg-app-panel-hover-soft hover:text-app-text"].join(" ")}
              >
                {copiedName ? "Kopierat!" : "Kopiera namn"}
              </button>
            </div>
          ) : null}
          {status !== "Karta redo" ? (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-app-border bg-app-overlay-soft px-3 py-2 text-xs text-app-text-muted shadow-[var(--app-shadow-panel)]">
              {status}
            </div>
          ) : null}
        </div>

        <aside className="order-first border-b border-app-border bg-app-panel-soft p-2.5 lg:order-none lg:border-b-0 lg:border-l lg:p-3">
          <div className="grid gap-2.5 min-[360px]:grid-cols-2 lg:block lg:space-y-4">
            <div className="min-[360px]:col-span-2 lg:col-span-1">
              <h2 className={ui.sectionTitle}>Lager</h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <LayerToggleButton
                  label="Länsgränser"
                  active={regionsVisible}
                  onClick={() => setRegionsVisible((value) => !value)}
                />
                <LayerToggleButton
                  label="Kommungränser"
                  active={municipalitiesVisible}
                  onClick={() => setMunicipalitiesVisible((value) => !value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className={ui.sectionTitle}>
                  Länfokus
                </h2>
                {selectedRegion ? (
                  <Button
                    type="button"
                    onClick={clearFocus}
                    variant="ghost"
                    size="xs"
                  >
                    Rensa
                  </Button>
                ) : null}
              </div>

              <div
                className="relative mt-1.5"
                onBlur={() => {
                  window.setTimeout(() => setRegionDropdownOpen(false), 120);
                }}
              >
                <input
                  value={regionSearch}
                  onFocus={() => setRegionDropdownOpen(true)}
                  onChange={(event) => {
                    setRegionSearch(event.target.value);
                    setRegionDropdownOpen(true);
                  }}
                  placeholder="Sök län"
                  className={ui.input}
                />

                {regionDropdownOpen ? (
                  <div className={ui.selectMenuPanel}>
                    {visibleRegions.length > 0 ? (
                      visibleRegions.map((region) => (
                        <button
                          key={region.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectRegion(region)}
                          className={[
                            ui.selectMenuOption,
                            selectedRegion?.id === region.id
                              ? "bg-app-accent-bg text-app-accent-text"
                              : "text-app-text-muted hover:bg-app-panel-hover-soft hover:text-app-text",
                          ].join(" ")}
                        >
                          {region.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-app-text-subtle">
                        Inget län hittades.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className={ui.sectionTitle}>
                  Kommunfokus
                </h2>
                {selectedMunicipality ? (
                  <Button
                    type="button"
                    onClick={clearFocus}
                    variant="ghost"
                    size="xs"
                  >
                    Rensa
                  </Button>
                ) : null}
              </div>

              <div
                className="relative mt-1.5"
                onBlur={() => {
                  window.setTimeout(
                    () => setMunicipalityDropdownOpen(false),
                    120,
                  );
                }}
              >
                <input
                  value={municipalitySearch}
                  onFocus={() => setMunicipalityDropdownOpen(true)}
                  onChange={(event) => {
                    setMunicipalitySearch(event.target.value);
                    setMunicipalityDropdownOpen(true);
                  }}
                  placeholder="Sök kommun"
                  className={ui.input}
                />

                {municipalityDropdownOpen ? (
                  <div className={ui.selectMenuPanel}>
                    {visibleMunicipalities.length > 0 ? (
                      visibleMunicipalities.map((municipality) => (
                        <button
                          key={municipality.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectMunicipality(municipality)}
                          className={[
                            ui.selectMenuOption,
                            selectedMunicipality?.id === municipality.id
                              ? "bg-app-accent-bg text-app-accent-text"
                              : "text-app-text-muted hover:bg-app-panel-hover-soft hover:text-app-text",
                          ].join(" ")}
                        >
                          {municipality.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-app-text-subtle">
                        Ingen kommun hittades.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Surface>
  );
}
