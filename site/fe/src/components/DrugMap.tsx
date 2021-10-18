import * as React from "react";
import mapboxgl from "mapbox-gl";
import { useContext, useEffect, useRef, useState } from "react";

import "mapbox-gl/dist/mapbox-gl.css";
import "../styles/map.css";
import { DMap } from "../DMap";
import { MobXProviderContext, observer, Provider } from "mobx-react";
import { mapStore, MapStoreProviderContext } from "../MapStore";
import { MapNotification } from "./MapNotification";

mapboxgl.accessToken = process.env.MAPBOXGL_ACCESS_TOKEN;

type Palette = {
    color: string,
    figure: string,
    darkText?: boolean,
};

const ListItem = (p: {
    title: string,
    selected: boolean,
    setDrug: (name?: string) => void,
}) => {
    return (
        <div 
            className={`list__item ${p.selected ? "list__item--selected" : ""}`}
            onClick={() => p.setDrug()}
        >
            {p.title}
        </div>
    )
};

const BigNumber = (p: {title: string, number: string | number}) => {
    return (
        <div className="bignumber">
            <div className="bignumber__title">{p.title}</div>
            <div className="bignumber__number">{p.number}</div>
        </div>
    )
};

const LegendPalette = (p: {palettes: Palette[]}) => {
    return (
        <React.Fragment>
            <div className="legend__labels">
                <div>0</div>
                <div>50</div>
                <div>100</div>
            </div>
            <div style={{width: "15rem", height: "3rem", position: "relative"}}>
                <div className="palette"></div>
            </div>
        </React.Fragment>
    );
};

const Legend = () => {
    return (
        <div className={"legend"}>
            <div className="legend__header">% Adulterated samples in area</div>
            <LegendPalette 
                palettes={[
                    {color: "#238823", figure: "0%" },
                    {color: "#FFBF00", figure: "50%", darkText: true },
                    {color: "#D2222D", figure: "100%" },
                ]}
            />
        </div>
    );
}

const StatsNotification = observer(() => {
    const s = useContext<MapStoreProviderContext>(MobXProviderContext).store;

    return s.notificationOpen ? (
        <MapNotification title={<span>💊 Summary of {s.selectedDrug ? <span>expected <span className="highlighted">{s.selectedDrug}</span></span> : ""} samples {s.selectedCounty ? <span> from <span className="highlighted">{s.selectedCounty}</span></span> : ""}</span>} close={() => (s.notificationOpen = false)}>
            {s.adulterants && 
            <React.Fragment>
                {s.count > 0 ? 
                (<React.Fragment>
                    <div className="bignumber__container">
                    <BigNumber title="# Samples" number={s.count}/>
                    <BigNumber title="% With Adulterants" number={`${s.percentWithAdulterants}%`}/>
                    </div>
                    <table>
                        <tr>
                            <th>Substance</th><th># Samples Containing</th><th>% Samples Containing</th>
                        </tr>
                        {s.adulterants.map((a, idx) => (
                            <tr key={idx} className={a.substance === s.selectedDrug ? "match-drug" : ""}>
                                <td>{a.substance}</td><td>{a.count}</td><td>{Math.round(a.percentage * 100) || "<1"}%</td>
                            </tr>
                        ))}
                    </table>
                </React.Fragment>) : <div className="list__item-header">No samples found!</div>}
            </React.Fragment>}   
        </MapNotification>
    ) : null;
});

const IntroNotification = observer(() => {
    const s = useContext<MapStoreProviderContext>(MobXProviderContext).store;

    const close = () => {
        s.notificationOpen = true; 
        s.introOpen = false;
    }

    return (
        <MapNotification
            title={<span style={{letterSpacing: "0.09rem"}}>💊 Drugmap</span>}
            close={close}
        >
            <p>
            UKDrugMap shows the percent of adulterated recreational drug samples tested in the UK, separated by region. A substance is adulterated if it contains an active chemical besides the user's expected drug.
            </p>
            <p>
            Click a substance name on the left panel to see substance-specific results. Click a region to view results only for that region. 
            </p>
            <p>
            Data is provided by <a href="https://www.wedinos.org/" target="_blank" className={"link"} style={{textDecoration: "underline"}}>Wedinos</a>, a drug testing service whose users send samples anonymously from across the UK.
            </p>
            <br />
            <div className="link" onClick={close}>Continue</div>
        </MapNotification>
    )
});

const DrugMapContent = observer(() => {
    const mapContainer = useRef(null);
    const dmap = useRef<DMap | null>(null);
    const [lng, setLng] = useState(-4.1991);
    const [lat, setLat] = useState(54.5168);
    const [zoom, setZoom] = useState(5.18);

    const { store } = useContext<MapStoreProviderContext>(MobXProviderContext);

    const onSetDrug = (name?: string) => {
        dmap.current!.setDrug(name);
        store.selectedDrug = name;
    };

    useEffect(() => {
        if (dmap.current) return; 
        dmap.current = new DMap(mapContainer.current!, {lng, lat, zoom});
    });

    useEffect(() => {
        if (!dmap.current) return; 
        const { map } = dmap.current;
        map.on("move", () => {
            setLng(map.getCenter().lng.toFixed(4));
            setLat(map.getCenter().lat.toFixed(4));
            setZoom(map.getZoom().toFixed(2));
        });
    });

    return (
        <div className="relative">
            <div className="sidebar">
                {/* Longitude: {lng} | Latitude: {lat} | Zoom: {zoom} | {store.selectedCounty} */}
                <div className={"list__item-header"}>🧪 Substances</div>
                <ListItem title={"All"} setDrug={() => onSetDrug()} selected={!store.selectedDrug}/>
                <ListItem title={"Amphetamine"} setDrug={() => onSetDrug("amphetamine")} selected={store.selectedDrug === "amphetamine"}/>
                <ListItem title={"Cocaine"} setDrug={() => onSetDrug("cocaine")} selected={store.selectedDrug === "cocaine"}/>
                <ListItem title={"Diazepam"} setDrug={() => onSetDrug("diazepam")} selected={store.selectedDrug === "diazepam"}/>
                <ListItem title={"Heroin"} setDrug={() => onSetDrug("heroin")} selected={store.selectedDrug === "heroin"}/>
                <ListItem title={"Ketamine"} setDrug={() => onSetDrug("ketamine")} selected={store.selectedDrug === "ketamine"}/>
                <ListItem title={"MDMA"} setDrug={() => onSetDrug("mdma")} selected={store.selectedDrug === "mdma"}/>
                <div className={"about"} onClick={() => (store.introOpen = true)}>ℹ️about</div>
            </div>
            <Legend/>
            {store.introOpen ? <IntroNotification/> : <StatsNotification/>}
            <div ref={mapContainer} className="map-container"/>
        </div>
    ); 
});

export const DrugMap = () => (
    <Provider store={mapStore}>
        <DrugMapContent/>
    </Provider>
);