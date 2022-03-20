export class RoutePlanner extends EventTarget {

    #locationsList;
    #storage;
    #wrapper;
    #dragEl;
    #select;
    #routesWrapper;
    #reverseCheckbox;
    #clearButton;
    #startButton;
    #dragHandlers = {};
    #isStarted = false;

    constructor(locationsList, wrapper = document.querySelector("body")) {
        super();
        this.#wrapper = wrapper;
        this.#routesWrapper = this.#wrapper.querySelector(".routes-wrapper");
        this.#reverseCheckbox = wrapper.querySelector("#reverce-checkbox");
        this.#clearButton = wrapper.querySelector("#clear-router");
        this.#startButton = wrapper.querySelector("#start-router");
        this.#locationsList = locationsList;
        this.#storage = window.sessionStorage;

        this.#storage?.getItem("route") ? this.#initBuilt() : this.#buildNew();

        this.#wrapper.classList.remove("hidden");
    }


    #initBuilt() {

    }


    #buildNew() {
        const select = this.#select = document.createElement("select");
        const defaultOption = document.createElement("option");

        defaultOption.value = defaultOption.textContent = "Add location";
        defaultOption.disabled = true;
        defaultOption.selected = true;

        select.append(defaultOption);

        this.#locationsList.forEach((location) => {
            const option = document.createElement("option");
            option.value = option.textContent = location;
            option.setAttribute("name", `option-${location}`);
            select.append(option);
        });

        select.addEventListener("change", this.#onLocationSelect.bind(this));

        this.#clearButton.addEventListener("click", this.#onClearButtonClick.bind(this));
        this.#startButton.addEventListener("click", this.#onStartButtonClick.bind(this));

        this.#routesWrapper.append(select);
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
        const textWrapper = document.createElement("span");
        closeButton.role = "button";
        closeButton.classList.add("close-button");
        closeButton.addEventListener("click", this.#onRemoveLocationClick.bind(this), {once: true});

        textWrapper.textContent = location;
        textWrapper.classList.add("text-wrapper");
        locationEl.classList.add("route-location");
        locationEl.draggable = true;

        const dragHandlers = this.#dragHandlers = {
            dragstart: this.#onDragStart.bind(this),
            dragover: this.#onDragOver.bind(this),
            dragend: this.#onDragEnd.bind(this),
            dragenter: this.#onDragEnter.bind(this),
            dragleave: this.#onDragLeave.bind(this),
            drop: this.#onDrop.bind(this),
        };


        locationEl.addEventListener("dragstart", dragHandlers.dragstart, false);
        locationEl.addEventListener("dragover", dragHandlers.dragover, false);
        locationEl.addEventListener("dragend", dragHandlers.dragend, false);
        locationEl.addEventListener("dragenter", dragHandlers.dragenter, false);
        locationEl.addEventListener("dragleave", dragHandlers.dragleave, false);
        locationEl.addEventListener("drop", dragHandlers.drop, false);

        locationEl.append(textWrapper);
        locationEl.append(closeButton);
        this.#routesWrapper.append(locationEl);

        if (this.#clearButton.disabled) {
            this.#clearButton.disabled = false;
            this.#clearButton.classList.remove("hidden-abs");
        }

        if (this.#routesWrapper.children.length === 3) {
            this.#reverseCheckbox.parentNode.classList.remove("hidden-abs");
            this.#startButton.classList.remove("hidden-abs");
            this.#startButton.disabled = false;
        }
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

        this.#getRouteElsList().forEach((item) => {
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

        const targetEl = event.currentTarget;
        const dragEl = this.#dragEl;

        if (dragEl !== targetEl) {
            const targetTextWrapper = targetEl.querySelector(".text-wrapper");
            const dragTextWrapper = dragEl.querySelector(".text-wrapper");
            const dragElTextContent = dragTextWrapper.textContent;
            dragTextWrapper.textContent = targetTextWrapper.textContent;
            targetTextWrapper.textContent = dragElTextContent;
        }

        return false;
    }


    #onRemoveLocationClick(event) {
        const closeButton = event.currentTarget;
        const locationEl = closeButton.parentNode;
        const locationName = locationEl.querySelector(".text-wrapper").textContent;
        const option = this.#select.options.namedItem(`option-${locationName}`);
        const dragHandlers = this.#dragHandlers;
        locationEl.removeEventListener("dragstart", dragHandlers.dragstart, false);
        locationEl.removeEventListener("dragover", dragHandlers.dragover, false);
        locationEl.removeEventListener("dragend", dragHandlers.dragend, false);
        locationEl.removeEventListener("dragenter", dragHandlers.dragenter, false);
        locationEl.removeEventListener("dragleave", dragHandlers.dragleave, false);
        locationEl.removeEventListener("drop", dragHandlers.drop, false);
        option.disabled = false;
        locationEl.remove();

        if (this.#routesWrapper.children.length === 2) {
            this.#reverseCheckbox.parentNode.classList.add("hidden-abs");
            this.#startButton.classList.add("hidden-abs");
            this.#reverseCheckbox.checked = true;
        }
    }


    #onClearButtonClick(event) {
        this.#clearButton.disabled = true;
        this.#clearButton.classList.add("hidden-abs");
        this.#startButton.disabled = true;
        this.#startButton.classList.add("hidden-abs");
        this.#reverseCheckbox.parentNode.classList.add("hidden-abs");
        this.#reverseCheckbox.checked = false;
        this.#getRouteElsList().forEach((locationEl) => {
            locationEl.querySelector(".close-button").click();
        });
    }


    #onStartButtonClick(event) {
        this.#startButton.disabled = true;
        this.#getRouteElsList()[0].classList.add("active");
        this.#isStarted = true;
        this.dispatchEvent(new Event("StartRouter"));
    }


    #getRouteElsList() {
        return this.#routesWrapper.querySelectorAll(".route-location");
    }


    getActiveLocationIndex() {
        const activeLocationEl = this.#routesWrapper.querySelector(".route-location.active");
        const acitveLocationName = activeLocationEl.querySelector(".text-wrapper").textContent;
        return this.#locationsList.indexOf(acitveLocationName);
    }


    isStarted() {
        return this.#isStarted;
    }


    getStateData() {
        const routesList = [];
        this.#getRouteElsList().forEach((el) => {
            routesList.push(el.querySelector(".text-wrapper").textContent);
        })

        return {
            activeLocationIndex: this.getActiveLocationIndex(),
            locationsOrder: routesList,
            reverse: this.#reverseCheckbox.checked

        }
    }


}