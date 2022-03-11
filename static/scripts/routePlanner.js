export class RoutePlanner {

    #locationsList;
    #storage;
    #wrapper;
    #dragEl;

    constructor(locationsList, wrapper = document.querySelector("body")) {
        this.#wrapper = wrapper;
        this.#locationsList = locationsList;
        this.#storage = window.sessionStorage;

        this.#storage?.getItem("route") ? this.#initBuilt() : this.#buildNew();

        this.#wrapper.classList.remove("hidden");
    }


    #initBuilt() {

    }


    #buildNew() {
        const select = document.createElement("select");
        const defaultOption = document.createElement("option");

        defaultOption.value = defaultOption.textContent = "Add location";
        defaultOption.disabled = true;
        defaultOption.selected = true;

        select.append(defaultOption);

        this.#locationsList.forEach((location) => {
            const option = document.createElement("option");
            option.value = option.textContent = location;
            select.append(option);
        });

        select.addEventListener("change", this.#onLocationSelect.bind(this));

        this.#wrapper.appendChild(select);
    }


    #onLocationSelect(event) {
        const select = event.currentTarget;
        const option = this.#getSelectedOption(select);
        const location = option.value;
        option.disabled = true;
        select.options[0].selected = true;
        this.#addLocation(location);
    }


    #getSelectedOption(select) {
        return select.options[select.selectedIndex];
    }


    #addLocation(location) {
        const locationEl = document.createElement("div");
        const closeButton = document.createElement("div");
        closeButton.role = "button";
        closeButton.classList.add("close-button");

        locationEl.textContent = location;
        locationEl.classList.add("route-location");
        locationEl.draggable = true;
        locationEl.addEventListener("dragstart", this.#onDragStart.bind(this), false);
        locationEl.addEventListener("dragover", this.#onDragOver.bind(this), false);
        locationEl.addEventListener("dragend", this.#onDragEnd.bind(this), false);
        locationEl.addEventListener("dragenter", this.#onDragEnter.bind(this), false);
        locationEl.addEventListener("dragleave", this.#onDragLeave.bind(this), false);
        locationEl.addEventListener("drop", this.#onDrop.bind(this), false);

        locationEl.append(closeButton);
        this.#wrapper.append(locationEl);
    }


    #onDragStart(event) {
        const el = event.currentTarget;
        el.style.opacity = ".3";
        this.#dragEl = el;

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/html", el.innerHTML);
    }


    #onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        return false;
    }


    #onDragEnd(event) {
        const el = event.currentTarget;
        el.style.opacity = "1";

        this.#wrapper.querySelectorAll(".route-location").forEach((item) => {
            item.classList.remove("drag-enter");
        });

    }


    #onDragEnter(event) {
        const el = event.currentTarget;
        el.classList.add("drag-enter");
    }


    #onDragLeave(event) {
        const el = event.currentTarget;
        el.classList.remove("drag-enter");
    }


    #onDrop(event) {
        event.stopPropagation();

        const el = event.currentTarget;

        if (this.#dragEl !== el) {
            this.#dragEl.innerHTML = el.innerHTML;
            el.innerHTML = event.dataTransfer.getData("text/html");
        }

        return false;
    }

}