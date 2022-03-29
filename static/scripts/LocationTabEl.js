export class LocationTabEl extends HTMLElement {
    constructor() {
        super();

        if (this.children.length) {
            //TODO: remove nahui
            return
        }

        this.#build();

        return this;
    }

    #build() {
        const title = document.createElement("h2");
        const lastSave = document.createElement("h5");
        const noRunesWrapper = document.createElement("div");
        const runesWrapper = document.createElement("div");

        noRunesWrapper.classList.add("cols-wrapper", "top");
        runesWrapper.classList.add("cols-wrapper", "runes-wrapper");

        title.textContent = "Забег на ";
    }
}

customElements.define("location-tab", LocationTabEl);