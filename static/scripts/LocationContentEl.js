import {GameItemEl} from "./GameItemEl.js";

export class LocationContentEl extends HTMLElement {

    #configModel;
    #gameItemsList = [];
    #runeGameItemsList = [];

    constructor(configModel) {
        super();
        this.#configModel = configModel;
        this.#buildLayout();
        return this;
    }

    #buildLayout() {
        const noRunesWrapper = document.createElement("div");
        const runesWrapper = document.createElement("div");

        noRunesWrapper.classList.add("cols-wrapper", "top");
        noRunesWrapper.id = "top-inputs-wrapper";

        runesWrapper.classList.add("cols-wrapper", "runes-wrapper");
        runesWrapper.id = "runes-wrapper";

        this.#fillItems(noRunesWrapper);
        this.#fillRunes(runesWrapper);

        this.append(noRunesWrapper);
        this.append(runesWrapper);
    }


    #fillItems(wrapper) {
        const inputsList = ["Nothings", "DeathsMe", "Deaths", "Keys", "AndarielEssence", "MephistoEssence", "DiabloEssence", "BaalEssence", "Skillers", "Charms", "Uniques", "Sets", "Rare", "Bases", "Magic", "Jewels"];
        const inputsElListByName = {};

        for (let i = 0, len = inputsList.length; i < len; i++) {
            const inputTypeName = inputsList[i];
            const inputEl = new GameItemEl(false, inputTypeName);
            inputEl.classList.add("col");
            inputsElListByName[inputTypeName] = inputEl;
            this.#gameItemsList.push(inputEl);
            wrapper.append(inputEl);
        }

        inputsElListByName["Keys"].classList.add("keys");
        //TODO: maybe need to remove bossname+essence class
        inputsElListByName["AndarielEssence"].classList.add("andarielessence", "essence");
        inputsElListByName["MephistoEssence"].classList.add("mephistoessence", "essence");
        inputsElListByName["DiabloEssence"].classList.add("diabloessence", "essence");
        inputsElListByName["BaalEssence"].classList.add("baalessence", "essence");
    }

    #fillRunes(wrapper) {
        let col;
        let elRunesWrapper;
        const runesList = this.#configModel.runesList;


        for (let i = 0, len = runesList.length; i < len; i++) {
            const runeName = runesList[i];
            const runeEl = new GameItemEl(true, runeName);

            if (i === 0 || i % 5 === 0) {
                col = this.#getNewRunesColEl();
                wrapper.append(col);
                elRunesWrapper = col.querySelector(".runes-list-wrapper");
            }

            this.#runeGameItemsList.push(runeEl);
            elRunesWrapper.append(runeEl);
        }
    }


    #getNewRunesColEl() {
        const col = document.createElement("div");
        const content = document.createElement("div");
        col.classList.add("col");
        content.classList.add("runes-list-wrapper");
        col.append(content);
        return col;
    }


    hasChanges() {
        const locationData = this.#configModel.currentLocationData;
        const locationRunesData = locationData.Runes;

        //todo think about unite two loops to one

        for (let gameItemEl of this.#gameItemsList) {
            if (locationData[gameItemEl.name] !== gameItemEl.value) {
                console.warn("Detected change in ", gameItemEl.name);
                return true;
            }
        }

        for (let runeGameItemEl of this.#runeGameItemsList) {
            if (locationRunesData[runeGameItemEl.name] !== runeGameItemEl.value) {
                console.warn("Detected change in ", runeGameItemEl.name);
                return true;
            }
        }

        return false;
    }


    render() {
        const locationData = this.#configModel.currentLocationData;
        const locationRunesData = locationData.Runes;

        //todo think about unite two loops to one

        for (let gameItemEl of this.#gameItemsList) {
            gameItemEl.setData(locationData[gameItemEl.name].toString());
        }

        for (let runeGameItemEl of this.#runeGameItemsList) {
            runeGameItemEl.setData(locationRunesData[runeGameItemEl.name].toString());
        }
    }
}

customElements.define("location-content", LocationContentEl);