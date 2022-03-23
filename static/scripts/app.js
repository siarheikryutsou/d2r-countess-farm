import {Tabs} from "./tabs.js";
import {RoutePlanner} from "./routePlanner.js";

export class App {
    #elBody = null;
    #btnSave = null;
    #btnSaveNothings = null;
    #btnReset = null;
    #runesList = [];
    #config;
    #changesWrapper;
    #configCurrentSection;
    #locationsList;
    #currentTabEl;
    #currentTabIndex;
    #lastSaveInfo;
    #routePlanner;
    #tabs;
    #postRequestOptions = {method: "POST", headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}};
    #routerData;

    constructor() {
        document.addEventListener("DOMContentLoaded", this.#onDomContentLoaded.bind(this), {once: true});
    }

    #onDomContentLoaded(event) {
        this.#requestConfig().then(() => {
            this.#init();
            this.#initTabs();
            this.#initRoutePlanner();

            window.onbeforeunload = () => {
                if (this.#hasChanges()) {
                    return "You have unsaved changes. Are you sure, you want to close?";
                }
            };

            this.#elBody = document.getElementsByTagName("body")[0];
            this.#elBody.classList.remove("hidden");
        });
    }


    #requestConfig = async () => {
        const response = await fetch("/config");
        const data = await response.json();
        this.#currentTabIndex = data.tabIndex;
        this.#config = data.data;
        this.#routerData = data.routePlanner;
        this.#lastSaveInfo = data.lastSave;
    };


    #initTabs() {
        const tabButtonsWrapper = document.querySelector("#tab-buttons-wrapper");
        const tabsWrapper = document.querySelector("#tabs-wrapper");
        const tabContentsTemplate = document.querySelector("#content-template");


        for (let locationName in this.#config) {
            const button = document.createElement("button");
            const tabWrapper = document.createElement("div");
            const tabContent = tabContentsTemplate.content.cloneNode(true);

            button.textContent = locationName;
            tabWrapper.classList.add("tab");
            tabWrapper.id = locationName.toLowerCase() + "-wrapper";
            tabWrapper.appendChild(tabContent);

            tabButtonsWrapper.append(button);
            tabsWrapper.append(tabWrapper);

            this.#initTabContent(tabWrapper, this.#config[locationName], locationName);
        }

        const tabButtonsList = document.querySelectorAll("#tab-buttons-wrapper button");
        const tabElsList = document.querySelectorAll("#tabs-wrapper .tab");

        const tabs = this.#tabs = new Tabs(tabButtonsList, tabElsList, this.#currentTabIndex);
        this.#currentTabEl = tabElsList[tabs.activeTabIndex];

        tabs.addEventListener("change", (event) => {
            if (this.#hasChanges()) {
                if (confirm("Имеются в наличии несохраненные данные, переходим не сохраняя?") === true) {
                    this.#removeChanges();
                } else {
                    event.preventDefault();
                }
            }
        });

        tabs.addEventListener("changed", (event) => {
            const tabIndex = this.#currentTabIndex = tabs.activeTabIndex;
            this.#configCurrentSection = this.#config[this.#locationsList[tabIndex]];
            this.#currentTabEl = tabElsList[tabIndex];
        });
    }


    #init() {
        this.#locationsList = Object.keys(this.#config);
        this.#configCurrentSection = this.#config[this.#getCurrentLocationName()];
        this.#runesList = Object.keys(this.#configCurrentSection.Runes);
        this.#btnSave = document.getElementById("btnSave");
        this.#btnSaveNothings = document.getElementById("btnSaveNothings");
        this.#btnReset = document.getElementById("btnReset");
        this.#btnSave.disabled = true;
        this.#btnSave.style.display = "none";

        this.#fillRunes();

        this.#btnSaveNothings.addEventListener("click", (event) => {
            this.#btnSaveNothings.disabled = true;
            this.#getCurrentTabEl(`input[name=Nothings]`).value++;
            this.#saveConfig();
        });

        this.#btnSave.addEventListener("click", (event) => {
            this.#btnSave.disabled = true;
            this.#checkOnlyDeathAndAddNothingsIfItIs();
            this.#saveConfig();

        });


        this.#btnReset.addEventListener("click", (event) => {

            if (confirm("Вы уверены что хотите удалить все записи?") === true) {
                if (confirm("Сохранить бекап текущего конфига?")) {
                    this.#backupCurrentConfig().then(() => {
                        this.#resetConfig();
                    });
                } else {
                    this.#resetConfig();
                }
            }
        });

        this.#changesWrapper = document.getElementById("changes-wrapper");
    }


    #backupCurrentConfig = async () => {
        //console.log("Делаем бекап");
        await fetch("/backup");
    };


    #resetConfig() {
        //console.log("Сносим все нахуй");
        this.#btnReset.disabled = true;
        this.#requestReset().then(() => {
            window.location.reload();
        })
    }


    #initTabContent(tab, data, locationName) {
        const idPrefix = locationName.toLowerCase() + "-";

        tab.querySelectorAll("[id]").forEach((el) => {
            const lastId = el.id;
            const newId = idPrefix + lastId;
            el.id = newId;
            tab.querySelector(`[for=${lastId}]`)?.setAttribute("for", newId);
        });

        tab.querySelector(".attempt").textContent += locationName + " #" + data.Attempt;
        tab.querySelector(".last-save").textContent += this.#lastSaveInfo;

        const inputMe = tab.querySelector(`#${idPrefix}me`);
        const inputMercenary = tab.querySelector(`#${idPrefix}mercenary`);
        const inputsList = tab.querySelectorAll("input[type=number]");
        const elColKeys = tab.querySelector(".col.keys");
        const inputKeys = tab.querySelector(`#${idPrefix}keys`);
        const inputNothing = tab.querySelector(`#${idPrefix}nothing`);
        const inputSkillers = tab.querySelector(`#${idPrefix}skillers`);
        const inputCharms = tab.querySelector(`#${idPrefix}charms`);
        const inputUniques = tab.querySelector(`#${idPrefix}uniques`);
        const inputSets = tab.querySelector(`#${idPrefix}sets`);
        const essencesElList = tab.querySelectorAll("[data-essence=true]");

        inputMe.value = inputMe.min = data.DeathsMe.toString();
        inputMe.max = (data.DeathsMe + 1).toString();


        inputMe.addEventListener("change", (event) => {
            inputMercenary.value = (parseInt(inputMercenary.value) + (parseInt(inputMe.value) > data.DeathsMe ? 1 : -1)).toString();
            inputMercenary.dispatchEvent(new Event("change"));
        });

        inputMercenary.value = inputMercenary.min = data.Deaths.toString();

        elColKeys.style.display = data.keysAvailable ? "" : "none";
        inputKeys.value = inputKeys.min = data.Keys.toString();
        inputKeys.disabled = !data.keysAvailable;

        inputNothing.value = inputNothing.min = data.Nothings.toString();
        inputNothing.max = (data.Nothings + 1).toString();

        inputSkillers.value = inputSkillers.min = data.Skillers.toString();
        inputCharms.value = inputCharms.min = data.Charms.toString();
        inputUniques.value = inputUniques.min = data.Uniques.toString();
        inputSets.value = inputSets.min = data.Sets.toString();

        essencesElList.forEach((el) => {
            el.value = el.min = data[el.name];

            if (el.name.split("Essence")[0] !== locationName) {
                tab.querySelector(`.col.${el.name.toLowerCase()}`).style.display = "none";
            }
        });

        inputsList.forEach((el) => {
            el.addEventListener("change", (event) => {
                this.#onInputChanged(event)
            });
        });

        for (let i = 0, runesList = this.#runesList, len = runesList.length; i < len; i++) {
            const runeName = runesList[i];
            const runeEl = tab.querySelector(`input[name=${runeName}]`);
            runeEl.value = runeEl.min = data.Runes[runeName].toString();
        }
    }

    #onInputChanged(event) {
        const changed = this.#hasChanges();
        if (changed) {
            this.#addChanges(event.currentTarget);
        } else {
            this.#removeChanges(event.currentTarget);
        }
        this.#btnSave.disabled = !changed;
        this.#btnSaveNothings.style.display = !changed ? "" : "none";
        this.#btnSave.style.display = changed ? "" : "none";
    }


    #checkOnlyDeathAndAddNothingsIfItIs() {
        const currentLocation = this.#getCurrentLocationName().toLowerCase();
        const changeNodeds = this.#changesWrapper.childNodes;
        const deaths = this.#changesWrapper.querySelectorAll(`[data-el-id=${currentLocation}-me], [data-el-id=${currentLocation}-mercenary]`);
        if (deaths?.length === changeNodeds?.length) {
            //only death changed, add nothing
            this.#getCurrentTabEl("[name=Nothings]").value++;
        }
    }


    #addChanges(el) {
        const elId = el.id;
        const elName = el.name;
        const data = this.#configCurrentSection;
        let changeId = `data-el-id=${elId}`;
        let value = parseInt(el.value) - parseInt(el.hasAttribute('data-norune') ? data[elName] : data.Runes[elName]);
        let changeEl = this.#changesWrapper.querySelector(`[${changeId}]`) || document.createElement('span');

        if (!value && changeEl.parentNode) {
            changeEl.remove();
            return;
        }

        changeEl.setAttribute("data-el-id", elId);

        if (!this.#changesWrapper.contains(changeEl)) {
            this.#changesWrapper.append(changeEl);
        }

        changeEl.innerHTML = `(${el.labels[0].textContent}: ${value}); `;
    }


    #removeChanges(el) {
        const changesWrapper = this.#changesWrapper;
        changesWrapper.querySelectorAll("span").forEach((el) => {
            const id = el.dataset.elId;
            const input = this.#getCurrentTabEl(`input#${id}`);
            input.value = input.min;
        });
        this.#btnSave.disabled = true;
        this.#btnSave.style.display = "none";
        this.#btnSaveNothings.style.display = "";
        this.#btnSaveNothings.disabled = false;

        changesWrapper.innerHTML = "";
    }


    #hasChanges() {
        for (let i = 0, inputsList = this.#getCurrentTabElList(["input[type=number]"]), len = inputsList.length; i < len; i++) {
            let el = inputsList[i];
            let inputValue = parseInt(el.value);
            if (el.hasAttribute("data-norune")) {
                if (inputValue !== this.#configCurrentSection[el.name]) {
                    return true
                }
            } else {
                if (inputValue !== this.#configCurrentSection.Runes[el.name]) {
                    return true;
                }
            }
        }

        return false;
    }


    #fillRunes() {
        const templateEl = document.querySelector("#content-template").content;
        let runesWrapper = templateEl.querySelector(".runes-wrapper");
        let col;
        let elRunesWrapper;


        for (let i = 0, j = 0, len = this.#runesList.length; i < len; i++) {
            const runeName = this.#runesList[i];
            const runeNameToLowerCase = runeName.toLowerCase();
            const elRow = document.createElement("div");
            const elLabel = document.createElement("label");
            const wrapperEl = document.createElement("div");
            const elInput = document.createElement("input");
            const elImg = document.createElement("img");

            if (i === 0 || i % 5 === 0) {
                col = this.#createRunesCol();
                runesWrapper.append(col);
                elRunesWrapper = col.querySelector(".runes-list-wrapper");
            }

            elLabel.setAttribute("for", runeNameToLowerCase);
            elLabel.textContent = runeName;

            elInput.type = "number";
            elInput.id = runeNameToLowerCase;
            elInput.name = runeName;
            elImg.src = "static/img/" + runeName + ".png";
            wrapperEl.classList.add("input-wrapper");

            elRow.appendChild(elLabel);
            elRow.appendChild(wrapperEl);
            wrapperEl.appendChild(elInput);
            wrapperEl.appendChild(elImg);

            elRow.classList.add("row");

            elRunesWrapper.appendChild(elRow);
        }

    }


    #createRunesCol() {
        const col = document.createElement("div");
        const content = document.createElement("div");
        col.classList.add("col");
        content.classList.add("runes-list-wrapper");
        col.append(content);
        return col;
    }


    #postData = async () => {

        let data = this.#getData();

        await fetch("/save", Object.assign(this.#postRequestOptions, {body: JSON.stringify(data)}));
    };


    #requestReset = async () => {
        await fetch("/reset");
    };


    #getData() {
        const data = {
            location: this.#getCurrentLocationName(), tabIndex: this.#currentTabIndex, data: {
                keysAvailable: this.#configCurrentSection.keysAvailable,
                Attempt: this.#configCurrentSection.Attempt + 1,
                Keys: parseInt(this.#getCurrentTabEl(`input[name=Keys]`).value),
                Nothings: parseInt(this.#getCurrentTabEl(`input[name=Nothings]`).value),
                Deaths: parseInt(this.#getCurrentTabEl(`input[name=Deaths]`).value),
                DeathsMe: parseInt(this.#getCurrentTabEl(`input[name=DeathsMe]`).value),
                Skillers: parseInt(this.#getCurrentTabEl(`input[name=Skillers]`).value),
                Charms: parseInt(this.#getCurrentTabEl(`input[name=Charms]`).value),
                Uniques: parseInt(this.#getCurrentTabEl(`input[name=Uniques]`).value),
                Sets: parseInt(this.#getCurrentTabEl(`input[name=Sets]`).value),
                AndarielEssence: parseInt(this.#getCurrentTabEl(`input[name=AndarielEssence]`).value),
                MephistoEssence: parseInt(this.#getCurrentTabEl(`input[name=MephistoEssence]`).value),
                DiabloEssence: parseInt(this.#getCurrentTabEl(`input[name=DiabloEssence]`).value),
                BaalEssence: parseInt(this.#getCurrentTabEl(`input[name=BaalEssence]`).value),
                Runes: {}
            }
        };

        for (let i = 0, len = this.#runesList.length; i < len; i++) {
            let runeName = this.#runesList[i];
            data.data.Runes[runeName] = parseInt(this.#getCurrentTabEl(`input[name=${runeName}]`).value);
        }

        return data;
    }


    #getCurrentLocationName() {
        return this.#locationsList[this.#currentTabIndex];
    }


    #getCurrentTabEl(selector) {
        return this.#currentTabEl.querySelector(selector);
    }


    #getCurrentTabElList(selector) {
        return this.#currentTabEl.querySelectorAll(selector);
    }


    #initRoutePlanner() {
        this.#routePlanner = new RoutePlanner(this.#locationsList, document.querySelector(".route-planner-wrapper"), this.#routerData);
        this.#routePlanner.addEventListener("StartRouter", this.#onRouterStarted.bind(this));
        this.#routePlanner.addEventListener("ClearRouter", this.#onRouterCleared.bind(this));
        this.#routePlanner.addEventListener("RouteComplete", this.#onRouteComplete.bind(this));
        if (this.#routerData) {
            this.#tabs.disable();
        }
    }

    #saveConfig() {
        this.#elBody.classList.add("save-in-progress")
        document.addEventListener("keydown", (event) => {
            event.preventDefault();
        });
        this.#postData().then(() => {
            this.#onConfigSaved();
        });
    }


    #onConfigSaved() {
        window.onbeforeunload = () => {
        };
        //console.log("onConfigSaved");
        if (this.#routePlanner.isStarted()) {
            this.#routePlanner.routeCompleted()
            /*this.#saveRouterState().then(() => {
                window.location.reload();
            });*/

        } else {
            window.location.reload();
        }
    }


    #onRouterStarted(event) {
        //console.log("#onRouterStarted()", this.#routePlanner.getActiveLocationIndex());
        const activeLocationIndex = this.#routePlanner.getActiveLocationIndex();

        //console.log("activeLocationIndex:", activeLocationIndex);

        if (this.#currentTabIndex !== activeLocationIndex) {
            //console.log("Router start, we on another tab")
            this.#tabs.activeTabIndex = activeLocationIndex;
        } else {
            //console.log("Router start, we on true tab")
            this.#saveRouterState();
        }

        this.#tabs.disable();
    }


    #onRouterCleared(event) {
        //console.log("#onRouterCleared()");
        this.#saveRouterState(true);
        this.#routerData = null;
        this.#tabs.enable();
    }


    #onRouteComplete(event) {
        this.#saveRouterState().then(() => {
            window.location.reload();
        });


    }


    #saveRouterState = async (clear = false) => {
        //console.log("Save router data");
        let data = clear ? null : this.#routePlanner.getStateData();
        await fetch("/save_router_state", Object.assign(this.#postRequestOptions, {body: JSON.stringify(data)}));
    }


}

new App();