"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { buttonClassName } from "@/src/components/ui/Button";

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
  href: string;
  type: "Kommun" | "Region";
};

const REGION_SOURCE = "sweden-regions";
const MUNICIPALITY_SOURCE = "sweden-municipalities";

const SWEDEN_BOUNDS: [[number, number], [number, number]] = [
  [10.2, 55.0],
  [24.5, 69.2],
];

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
          variant: active ? "accent" : "toggle",
          size: "sm",
          className: "gap-2",
        }),
        active ? "shadow-[inset_0_0_0_1px_rgba(52,211,153,.18)]" : "",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          active ? "bg-emerald-300" : "bg-slate-500",
        ].join(" ")}
      />
      {label}
    </button>
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

function focusFeature(map: MapLibreMap, feature: MunicipalityFeature | RegionFeature) {
  const bounds = boundsForFeature(feature);
  if (!bounds) return;

  map.fitBounds(bounds, {
    padding: { top: 80, right: 80, bottom: 80, left: 80 },
    duration: 900,
    bearing: 0,
    pitch: 0,
    maxZoom: 9.2,
  });
}

export function SwedenBoundaryMap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const regionsVisibleRef = useRef(false);
  const municipalitiesVisibleRef = useRef(true);
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
              "background-color": "#020617",
            },
          },
        ],
      },
      center: [16.2, 62.4],
      zoom: 4.3,
      minZoom: 3.2,
      maxZoom: 10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }));
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    mapRef.current = map;

    map.on("load", async () => {
      try {
        const [regionsGeoJson, municipalitiesGeoJson] = await Promise.all([
          fetch("/geojson/swedish_regions.geojson").then((res) => res.json()),
          fetch("/geojson/swedish_municipalities.geojson").then((res) =>
            res.json(),
          ),
        ]);

        const regionFeatures: RegionFeature[] = regionsGeoJson.features ?? [];
        setRegions(
          regionFeatures
            .map((feature) => ({
              id: String(feature.properties.l_id),
              name: feature.properties.name,
              feature,
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "sv")),
        );

        const municipalityFeatures: MunicipalityFeature[] =
          municipalitiesGeoJson.features ?? [];
        setMunicipalities(
          municipalityFeatures
            .map((feature) => ({
              id: feature.properties.id,
              name: feature.properties.kom_namn,
              feature,
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "sv")),
        );

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
            "fill-color": "#94a3b8",
            "fill-opacity": 0.26,
          },
        });

        map.addLayer({
          id: "region-fill",
          type: "fill",
          source: REGION_SOURCE,
          layout: { visibility: "none" },
          paint: {
            "fill-color": "#2dd4bf",
            "fill-opacity": 0.03,
          },
        });

        map.addLayer({
          id: "region-hover",
          type: "fill",
          source: REGION_SOURCE,
          layout: { visibility: "none" },
          filter: EMPTY_REGION_FILTER,
          paint: {
            "fill-color": "#5eead4",
            "fill-opacity": 0.2,
          },
        });

        map.addLayer({
          id: "region-selected",
          type: "fill",
          source: REGION_SOURCE,
          layout: { visibility: "none" },
          filter: EMPTY_REGION_FILTER,
          paint: {
            "fill-color": "#34d399",
            "fill-opacity": 0.26,
          },
        });

        map.addLayer({
          id: "municipality-fill",
          type: "fill",
          source: MUNICIPALITY_SOURCE,
          layout: { visibility: "none" },
          paint: {
            "fill-color": "#14b8a6",
            "fill-opacity": 0.1,
          },
        });

        map.addLayer({
          id: "municipality-hover",
          type: "fill",
          source: MUNICIPALITY_SOURCE,
          layout: { visibility: "none" },
          filter: EMPTY_MUNICIPALITY_FILTER,
          paint: {
            "fill-color": "#34d399",
            "fill-opacity": 0.2,
          },
        });

        map.addLayer({
          id: "municipality-selected",
          type: "fill",
          source: MUNICIPALITY_SOURCE,
          layout: { visibility: "none" },
          filter: EMPTY_MUNICIPALITY_FILTER,
          paint: {
            "fill-color": "#22c55e",
            "fill-opacity": 0.28,
          },
        });

        map.addLayer({
          id: "municipality-line",
          type: "line",
          source: MUNICIPALITY_SOURCE,
          layout: { visibility: "none" },
          paint: {
            "line-color": "#67e8f9",
            "line-opacity": 0.35,
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
            "line-color": "#34d399",
            "line-opacity": 0.9,
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
        map.on("click", () => setContextMenu(null));
        map.on("contextmenu", (event) => {
          event.preventDefault();
          event.originalEvent.preventDefault();

          let feature: maplibregl.MapGeoJSONFeature | undefined;
          let type: MapContextMenu["type"] | null = null;

          if (municipalitiesVisibleRef.current) {
            feature = map.queryRenderedFeatures(event.point, {
              layers: ["municipality-fill"],
            })[0];
            type = feature ? "Kommun" : null;
          } else if (regionsVisibleRef.current) {
            feature = map.queryRenderedFeatures(event.point, {
              layers: ["region-fill"],
            })[0];
            type = feature ? "Region" : null;
          }

          if (!feature || !type || !containerRef.current) {
            setContextMenu(null);
            return;
          }

          const rect = containerRef.current.getBoundingClientRect();
          const x = event.originalEvent.clientX - rect.left;
          const y = event.originalEvent.clientY - rect.top;

          if (type === "Kommun") {
            const id = String(feature.properties?.id ?? "");
            const name = String(feature.properties?.kom_namn ?? "Kommun");
            setContextMenu({
              x,
              y,
              label: name,
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
            href: `/county/${encodeURIComponent(regionId)}`,
            type,
          });
        });

        map.fitBounds(SWEDEN_BOUNDS, { padding: 28, duration: 0 });
        setMapReady(true);
        setStatus("Karta redo");
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Kartan kunde inte laddas",
        );
      }
    });

    return () => {
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
      ["sweden-silhouette"],
      !regionsVisible && !municipalitiesVisible,
    );
    setLayerVisibility(
      map,
      ["region-fill", "region-line", "region-hover", "region-selected"],
      regionsVisible,
    );
    if (map.getLayer("region-fill")) {
      map.setPaintProperty(
        "region-fill",
        "fill-opacity",
        municipalitiesVisible ? 0.03 : 0.13,
      );
    }
  }, [mapReady, municipalitiesVisible, regionsVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    setLayerVisibility(
      map,
      ["sweden-silhouette"],
      !regionsVisible && !municipalitiesVisible,
    );
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
      map.setPaintProperty("municipality-fill", "fill-opacity", 0.1);
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

    if (!map?.isStyleLoaded()) return;

    setLayerVisibility(map, ["sweden-silhouette"], false);
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
      map.setPaintProperty("region-fill", "fill-opacity", 0.03);
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

    if (!map?.isStyleLoaded()) return;

    setLayerVisibility(map, ["sweden-silhouette"], false);
    setLayerVisibility(
      map,
      ["region-fill", "region-line", "region-hover", "region-selected"],
      true,
    );
    if (map.getLayer("region-fill")) {
      map.setPaintProperty(
        "region-fill",
        "fill-opacity",
        municipalitiesVisibleRef.current ? 0.03 : 0.13,
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

  function clearFocus() {
    const map = mapRef.current;
    setSelectedMunicipality(null);
    setSelectedRegion(null);
    setMunicipalitySearch("");
    setRegionSearch("");

    if (map?.isStyleLoaded()) {
      map.setFilter("municipality-selected", EMPTY_MUNICIPALITY_FILTER);
      map.setFilter("region-selected", EMPTY_REGION_FILTER);
      map.fitBounds(SWEDEN_BOUNDS, { padding: 28, duration: 700, bearing: 0 });
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Geografisk vy
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-50">
          Sverige karta
        </h1>
      </div>

      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="relative h-[62vh] min-h-[520px] lg:h-[calc(100vh-13rem)]">
          <div ref={containerRef} className="h-full w-full" />
          {contextMenu ? (
            <div
              className="absolute z-30 min-w-52 overflow-hidden rounded-md border border-slate-700 bg-slate-950 shadow-2xl"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                transform: "translate(8px, 8px)",
              }}
            >
              <div className="border-b border-slate-800 px-3 py-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {contextMenu.type}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-slate-100">
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
                className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
              >
                Gå till {contextMenu.type.toLowerCase()}
              </button>
            </div>
          ) : null}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-slate-800 bg-slate-950/85 px-3 py-2 text-xs text-slate-400 shadow-lg">
            {status}
          </div>
        </div>

        <aside className="order-first border-b border-slate-800 bg-slate-950/40 p-4 lg:order-none lg:border-b-0 lg:border-l">
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Lager</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <LayerToggleButton
                  label="Regiongränser"
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
                <h2 className="text-sm font-semibold text-slate-100">
                  Regionfokus
                </h2>
                {selectedRegion ? (
                  <button
                    type="button"
                    onClick={clearFocus}
                    className="text-xs font-medium text-slate-400 hover:text-slate-100"
                  >
                    Rensa
                  </button>
                ) : null}
              </div>

              <div
                className="relative mt-3"
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
                  placeholder="Sök region"
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-500/50"
                />

                {regionDropdownOpen ? (
                  <div className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-auto rounded-md border border-slate-800 bg-slate-950 shadow-xl">
                    {visibleRegions.length > 0 ? (
                      visibleRegions.map((region) => (
                        <button
                          key={region.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectRegion(region)}
                          className={[
                            "block w-full px-3 py-2 text-left text-sm transition",
                            selectedRegion?.id === region.id
                              ? "bg-emerald-500/15 text-emerald-100"
                              : "text-slate-300 hover:bg-slate-800 hover:text-slate-50",
                          ].join(" ")}
                        >
                          {region.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-slate-500">
                        Ingen region hittades.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-100">
                  Kommunfokus
                </h2>
                {selectedMunicipality ? (
                  <button
                    type="button"
                    onClick={clearFocus}
                    className="text-xs font-medium text-slate-400 hover:text-slate-100"
                  >
                    Rensa
                  </button>
                ) : null}
              </div>

              <div
                className="relative mt-3"
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
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-500/50"
                />

                {municipalityDropdownOpen ? (
                  <div className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-auto rounded-md border border-slate-800 bg-slate-950 shadow-xl">
                    {visibleMunicipalities.length > 0 ? (
                      visibleMunicipalities.map((municipality) => (
                        <button
                          key={municipality.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectMunicipality(municipality)}
                          className={[
                            "block w-full px-3 py-2 text-left text-sm transition",
                            selectedMunicipality?.id === municipality.id
                              ? "bg-emerald-500/15 text-emerald-100"
                              : "text-slate-300 hover:bg-slate-800 hover:text-slate-50",
                          ].join(" ")}
                        >
                          {municipality.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-slate-500">
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
    </section>
  );
}
