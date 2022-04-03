import {Tabs} from "./Tabs.js";

export class TabButtonsEl extends HTMLElement {

    #configModel;

    constructor(configModel) {
        super();
        this.#configModel = configModel;
        this.#buildLayout();
    }


    #buildLayout() {
        const buttonsList = [];
        const locationsData = this.#configModel.locationsData;

        for (let locationName in locationsData) {
            const button = document.createElement("button");
            button.textContent = locationName;
            buttonsList.push(button);
            this.append(button);
        }

        const tabs = new Tabs(buttonsList, null, this.#configModel.currentLocationIndex);
        this.addEventListener("changed", (event) => {
            this.#configModel.currentLocationIndex = tabs.activeTabIndex;
        });
    }

}

customElements.define("tab-buttons", TabButtonsEl);