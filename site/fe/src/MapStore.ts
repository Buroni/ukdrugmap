import { observable, makeObservable, action, reaction } from "mobx";

export class MapStore {

    @observable
    selectedCounty?: string;

    @observable
    count: number;

    @observable
    percentWithAdulterants: number;

    @observable
    selectedDrug?: string;

    @observable
    adulterants: any[];

    @observable 
    notificationOpen = true;

    @observable 
    introOpen = true;

    public constructor() {
        makeObservable(this);

        this.fetch();

        reaction(() => [this.selectedDrug, this.selectedCounty], (selectedDrug) => {
            this.introOpen = false;
            this.upateMapData();
        });
    }

    private upateMapData() {
        if (this.selectedDrug && !this.selectedCounty) {
            this.fetch("all")
        } else if (!this.selectedDrug && !this.selectedCounty) {
            this.fetch();
        } else {
            this.fetch(this.selectedCounty);
        }
    }

    @action
    private fetch(selectedCounty?: string) {
        return fetch(`/ukdrugmap/counties/${selectedCounty || ""}${this.selectedDrug ? `/${this.selectedDrug}` : ""}`).then((res: any) => res.json())
            .then(res => {
                this.adulterants = res.rows;
                this.percentWithAdulterants = res.percentWithAdulterants;
                this.count = res.count;
                this.notificationOpen = true;
            });
    }
}

export type MapStoreProviderContext = Record<string, MapStore>;

export const mapStore = new MapStore();
