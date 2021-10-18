import * as React from "react";

type Props = {
    title: string | React.ReactNode,
    close: () => void,
    children?: React.ReactNode;
}
export const MapNotification = (p: Props) => {
    return (
        <div className={"dmap-notification"}>
            <div style={{position: "relative"}}>
                <div style={{position: "absolute", top: 0, right: 0, cursor: "pointer"}} onClick={p.close}>x</div>
                <h3 style={{paddingRight: "1rem"}}>{p.title}</h3>
                <div>
                    {p.children}
                </div>
            </div>
        </div>
    );
}