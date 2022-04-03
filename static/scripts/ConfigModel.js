export class ConfigModel {

    #config;
    #locationsData;
    #locationsList;
    #configCurrentSection;
    #runesList;

    constructor(configDataJson) {
        this.#config = configDataJson;
        this.#locationsData = configDataJson.data;

        this.#locationsList = Object.keys(this.#locationsData);
        this.#configCurrentSection = this.#locationsData[this.currentLocationName];
        this.#runesList = Object.keys(this.#configCurrentSection.Runes);
    }

    requestConfig = async () => {
        const response = await fetch("/config");
        const data = await response.json();
    }

    get currentLocationIndex() {
        //TODO: rename it in config from tab to location
        return this.#config.tabIndex;
    }

    set currentLocationIndex(value) {
        this.#config.tabIndex = value;
    }

    get currentLocationName() {
        return this.#locationsList[this.currentLocationIndex];
    }

    get currentLocationData() {
        return this.locationsData[this.currentLocationName]
    }

    get runesList() {
        return this.#runesList;
    }

    get lastSaveInfo() {
        return this.#config.lastSave;
    }


    get locationsData() {
        return this.#locationsData;
    }

    get currentLocationAttempt() {
        return this.currentLocationData.Attempt;
    }
}