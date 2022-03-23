export class RoutePlannerV1 {

    #locationsList;
    #storage;
    #wrapper;
    #selectList = [];

    constructor(locationsList, wrapper = document.querySelector("body")) {
        console.log("Route planner constructor:", locationsList);
        this.#wrapper = wrapper;
        this.#locationsList = locationsList;
        this.#storage = window.sessionStorage;

        this.#storage?.getItem("route") ? this.#initBuilt() : this.#buildNew();

        this.#wrapper.classList.remove("hidden");
    }


    #initBuilt() {

    }


    #buildNew() {
        const addButton = document.createElement("button");
        addButton.textContent = "Add location";
        addButton.addEventListener("click", this.#onAddLocationClick.bind(this));
        this.#wrapper.append(addButton);
    }


    #onAddLocationClick(event) {
        const select = document.createElement("select");
        const freeLocations = this.#getFreeLocations();

        freeLocations.forEach((locationName) => {
            const option = document.createElement("option");
            option.value = option.textContent = locationName;
            select.append(option);
        });


        select.setAttribute("draggable", true);
        select.setAttribute("data-loc", freeLocations[0]);
        select.addEventListener("change", this.#onSelectChange.bind(this));
        this.#selectList.push(select);
        this.#wrapper.append(select);

        if (freeLocations.length === 1) {
            event.currentTarget.disabled = true;
        }

    }


    #onSelectChange(event) {
        const select = event.currentTarget;
        const lastSelectedLocation = select.dataset.loc;
        const newSelectedLocation = this.#getSelectedOptionValue(select);
        const existsSelect = this.#wrapper.querySelector(`[data-loc=${newSelectedLocation}]`);

        if (existsSelect) {
            this.#changeLocationInSelect(existsSelect, lastSelectedLocation);
            this.#removeOptionFromSelectByValue(existsSelect, newSelectedLocation);
        }

        select.setAttribute("data-loc", newSelectedLocation);

        this.#removeOptionFromSelectByValue(select, lastSelectedLocation);
        select.options.forEach((option) => {
            if (option.value === lastSelectedLocation) {
                option.remove();
            }
        })
    }


    #getFreeLocations() {
        const result = [];
        const selectedLocations = [];

        this.#selectList.forEach((select) => {
            selectedLocations.push(select.value);
        });

        this.#locationsList.forEach((location) => {
            if (!selectedLocations.includes(location)) {
                result.push(location);
            }
        });

        return result;
    }


    #getSelectedOptionValue(select) {
        return select.options[select.selectedIndex].value;
    }


    #changeLocationInSelect(select, location) {
        select.options[0].value = select.options[0].textContent = location;
        select.setAttribute("data-loc", location);

    }


    #removeOptionFromSelectByValue(select, value) {
        const options = select.options;
        for (let i = 0, len = options.length; i < len; i++) {
            const option = options[i];
            if (option.value === value) {
                option.remove();
                break;
            }
        }
    }

}