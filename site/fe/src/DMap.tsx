import mapboxgl from "mapbox-gl";
import { mapStore } from "./MapStore";

const buildFillColor = (property: string): any => ({
        property,
        stops: [[0, "#238823"], [0.5, "#FFBF00"], [1, "#D2222D"]],
});

let hoveredCountyId: any = null;
let selectedCountyId: any = null;

export class DMap {
    public map: mapboxgl.Map;

    public constructor(container: HTMLElement, options: {lng: number, lat: number, zoom: number}) {
        const {lng, lat, zoom} = options;
        this.initMap(container, {lng, lat, zoom});   
        this.map.on("load", () => {
            this.addSources();
            this.customStyles();
            this.addLayers();
            this.addListeners();
        });
    }

    public setDrug(drugName?: string) {
        const suffix = drugName ? `_${drugName}` : "";
        this.map.setPaintProperty("counties-fill", "fill-color", {
            ...buildFillColor(`percent_adulterant_found${suffix}`),
        })
        this.map.setFilter("counties-fill", [">", `num_adulterant_found${suffix}`, 0]);
        this.map.setFilter("counties-nodata", ["==", `num_adulterant_found${suffix}`, 0]);
        this.map.setLayoutProperty("poi-labels", "text-field", `{ctyua19nm} ({num_adulterant_found${suffix}})`);
    }

    private initMap(container: HTMLElement, options: {lng: number, lat: number, zoom: number}) {
        this.map = new mapboxgl.Map({
            container: container,
            style: "mapbox://styles/mapbox/dark-v10",
            center: [options.lng, options.lat], 
            zoom: options.zoom,
        });
    }

    private addSources() {
        this.map.addSource("counties", {
            "type": "geojson",
            "data": `/ukdrugmap/static/counties.json?nocache=${10000 + Math.floor(Math.random() * 99999)}`
        });

        this.map.addSource("county-centres", {
            "type": "geojson",
            "data": `/ukdrugmap/static/county_centres.json?nocache=${10000 + Math.floor(Math.random() * 99999)}`
        });
    }

    private addLayers() {
        this.map.addLayer({
            "id": "counties-fill",
            "type": "fill",
            "source": "counties", 
            "layout": {},
            "paint": {
                "fill-color": buildFillColor("percent_adulterant_found"),
                "fill-opacity": 0.9,
                "fill-outline-color": [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    "white",
                    "black",
                ]
            },
            "filter": [">", "num_adulterant_found", 0],
        });

        this.map.addLayer({
            "id": "counties-nodata",
            "type": "fill",
            "source": "counties",
            "layout": {},
            "paint": {
                "fill-color": "#c1c1c1",
                "fill-outline-color": "black",
            "fill-opacity": 0.9
            },
            "filter": ["==", "num_adulterant_found", 0],
            });

        this.map.addLayer({
            "id": "county-fill-hover",
            "type": "line",
            "source": "counties",
            "layout": {},
            "paint": {
                "line-color": "white",
                "line-opacity": [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    1,
                    0,
                ],
                "line-width": 1,
            }
        });

        this.map.addLayer({
            "id": "county-fill-selected",
            "type": "line",
            "source": "counties",
            "layout": {},
            "paint": {
                "line-color": "white",
                "line-opacity": [
                    "case",
                    ["boolean", ["feature-state", "selected"], false],
                    1,
                    0,
                ],
                "line-width": 2,
            }
        });

        this.map.addLayer({
            "id": "poi-labels",
            "type": "symbol",
            "source": "county-centres",
            "layout": {
                "text-field": "{ctyua19nm} ({num_adulterant_found})",
                "text-variable-anchor": ["top", "bottom", "left", "right"],
                "text-radial-offset": 0.5,
                "text-justify": "auto",
                "text-size": 13,
            },
            "paint": {
                "text-halo-width": 1,
                "text-halo-color": "black",
                "text-color": "white",
            },
        });
    }

    private customStyles() {
        // Hide roads
        this.map.getStyle().layers.map((layer: any) => {
            if (layer.id.indexOf("road") >= 0 || layer.type === "symbol") {
                this.map.setLayoutProperty(layer.id, "visibility", "none");
            }
        });
    }

    private setRegionBorderVisibility(hover: boolean) {
        this.map.setFeatureState(
            { source: "counties", id: hoveredCountyId },
            { hover }
        );
    }

    private setSelectedRegionBorderVisibility(selected: boolean) {
        this.map.setFeatureState(
            { source: "counties", id: selectedCountyId },
            { selected }
        );
    }

    private addListeners() {
        this.map.on("click", "counties-nodata", () => {
            mapStore.selectedCounty = undefined;
            this.setSelectedRegionBorderVisibility(false);
        });

        this.map.on("click", "water", () => {
            mapStore.selectedCounty = undefined;
            this.setSelectedRegionBorderVisibility(false);
        });

        this.map.on("click", "counties-fill", (e: any) => {
            mapStore.selectedCounty = e.features[0].properties.ctyua19nm;

            if (e.features.length > 0) {
                if (selectedCountyId !== null) {
                    this.setSelectedRegionBorderVisibility(false);
                }
                selectedCountyId = e.features[0].id;
                this.setSelectedRegionBorderVisibility(true);
            }
        });

        this.map.on("mousemove", "counties-nodata", () => {
            this.setRegionBorderVisibility(false);
        });

        this.map.on("mousemove", "water", () => {
            this.setRegionBorderVisibility(false);
        });

        this.map.on("mousemove", "counties-fill", (e: any) => {
            if (e.features.length > 0) {
                if (hoveredCountyId !== null) {
                    this.setRegionBorderVisibility(false);
                }
                hoveredCountyId = e.features[0].id;
                this.setRegionBorderVisibility(true);
            }
        });
    }
}