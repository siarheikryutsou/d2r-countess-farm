import {Tabs} from "./tabs.js";

export class App {

    _elBody = null;
    _btnSave = null;
    #btnSaveNothings = null;
    _btnReset = null;
    _runesList = [];
    _config;
    _changesWrapper;
    _configCurrentSection;
    _locationsList;
    _currentTabEl;
    _currentTabIndex;

    constructor() {
        document.addEventListener("DOMContentLoaded", this._onDomContentLoaded.bind(this), {once: true});
    }

    _onDomContentLoaded(event) {
        this._requestConfig().then(() => {
            this._init();
            this._initTabs();
            this._elBody = document.getElementsByTagName("body")[0];
            this._elBody.classList.remove("hidden");
        });
    }


    _requestConfig = async () => {
        const response = await fetch("/config");
        const data = await response.json();
        this._currentTabIndex = data.tabIndex;
        this._config = data.data;
    };


    _initTabs() {
        const tabButtonsWrapper = document.querySelector("#tab-buttons-wrapper");
        const tabsWrapper = document.querySelector("#tabs-wrapper");
        const tabContentsTemplate = document.querySelector("#content-template");


        for (let locationName in this._config) {
            const button = document.createElement("button");
            const tabWrapper = document.createElement("div");
            const tabContent = tabContentsTemplate.content.cloneNode(true);

            button.textContent = locationName;
            tabWrapper.classList.add("tab");
            tabWrapper.id = locationName.toLowerCase() + "-wrapper";
            tabWrapper.appendChild(tabContent);

            tabButtonsWrapper.append(button);
            tabsWrapper.append(tabWrapper);

            this._initTabContent(tabWrapper, this._config[locationName], locationName);
        }

        const tabButtonsList = document.querySelectorAll("#tab-buttons-wrapper button");
        const tabElsList = document.querySelectorAll("#tabs-wrapper .tab");

        const tabs = new Tabs(tabButtonsList, tabElsList, this._currentTabIndex);
        this._currentTabEl = tabElsList[tabs.activeTabIndex];

        tabs.addEventListener("change", (event) => {
            if (this._hasChanges()) {
                if (confirm("Имеются в наличии несохраненные данные, переходим не сохраняя?") === true) {
                    this._removeChanges();
                } else {
                    event.preventDefault();
                }
            }
        });

        tabs.addEventListener("changed", (event) => {
            const tabIndex = this._currentTabIndex = tabs.activeTabIndex;
            this._configCurrentSection = this._config[this._locationsList[tabIndex]];
            this._currentTabEl = tabElsList[tabIndex];
        });
    }


    _init() {
        this._locationsList = Object.keys(this._config);
        this._configCurrentSection = this._config[this._locationsList[this._currentTabIndex]];
        this._runesList = Object.keys(this._configCurrentSection.Runes);
        this._btnSave = document.getElementById("btnSave");
        this.#btnSaveNothings = document.getElementById("btnSaveNothings");
        this._btnReset = document.getElementById("btnReset");
        this._btnSave.disabled = true;
        this._btnSave.style.display = "none";

        this._fillRunes();

        this.#btnSaveNothings.addEventListener("click", (event) => {
            this.#btnSaveNothings.disabled = true;
            this._currentTabEl.querySelector(`input[name=Nothings]`).value++;

            this._postData().then(() => {
                window.location.reload();
            });
        });

        this._btnSave.addEventListener("click", (event) => {
            this._btnSave.disabled = true;
            this._postData().then(() => {
                window.location.reload();
            });
        });

        this._btnReset.addEventListener("click", (event) => {

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

        this._changesWrapper = document.getElementById("changes-wrapper");
    }


    #backupCurrentConfig = async () => {
        console.log("Делаем бекап");
        await fetch("/backup");
    };


    #resetConfig() {
        console.log("Сносим все нахуй");
        this._btnReset.disabled = true;
        this._requestReset().then(() => {
            window.location.reload();
        })
    }


    _initTabContent(tab, data, locationName) {
        const idPrefix = locationName.toLowerCase() + "-";

        tab.querySelectorAll("[id]").forEach((el) => {
            const lastId = el.id;
            const newId = idPrefix + lastId;
            el.id = newId;
            tab.querySelector(`[for=${lastId}]`)?.setAttribute("for", newId);
        });

        tab.querySelector(".attempt").textContent += locationName + " #" + data.Attempt;

        const inputMe = tab.querySelector(`#${idPrefix}me`);
        const inputMercenary = tab.querySelector(`#${idPrefix}mercenary`);
        const inputsList = tab.querySelectorAll("input[type=number]");
        const elColKeys = tab.querySelector(".col.keys");
        const inputKeys = tab.querySelector(`#${idPrefix}keys`);
        const inputNothing = tab.querySelector(`#${idPrefix}nothing`);

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

        inputsList.forEach((el) => {
            el.addEventListener("change", (event) => {
                this._onInputChanged(event)
            });
        });

        for (let i = 0, runesList = this._runesList, len = runesList.length; i < len; i++) {
            const runeName = runesList[i];
            const runeEl = tab.querySelector(`input[name=${runeName}]`);
            runeEl.value = runeEl.min = data.Runes[runeName].toString();
        }
    }

    _onInputChanged(event) {
        const changed = this._hasChanges();
        if (changed) {
            this._addChanges(event.currentTarget);
        } else {
            this._removeChanges(event.currentTarget);
        }
        this._btnSave.disabled = !changed;
        this.#btnSaveNothings.style.display = !changed ? "" : "none";
        this._btnSave.style.display = changed ? "" : "none";
    }


    _addChanges(el) {
        const elId = el.id;
        const elName = el.name;
        const data = this._configCurrentSection;
        let changeId = `data-el-id=${elId}`;
        let value = parseInt(el.value) - parseInt(el.hasAttribute('data-norune') ? data[elName] : data.Runes[elName]);
        let changeEl = this._changesWrapper.querySelector(`[${changeId}]`) || document.createElement('span');

        if (!value && changeEl.parentNode) {
            changeEl.remove();
            return;
        }

        changeEl.setAttribute("data-el-id", elId);

        if (!this._changesWrapper.contains(changeEl)) {
            this._changesWrapper.append(changeEl);
        }

        changeEl.innerHTML = `(${el.labels[0].textContent}: ${value}); `;
    }


    _removeChanges(el) {
        const changesWrapper = this._changesWrapper;
        changesWrapper.querySelectorAll("span").forEach((el) => {
            const id = el.dataset.elId;
            const input = this._currentTabEl.querySelector(`input#${id}`);
            input.value = input.min;
        });
        this._btnSave.disabled = true;
        this._btnSave.style.display = "none";
        this.#btnSaveNothings.style.display = "";
        this.#btnSaveNothings.disabled = false;

        changesWrapper.innerHTML = "";
    }


    _hasChanges() {
        for (let i = 0, inputsList = this._currentTabEl.querySelectorAll(["input[type=number]"]), len = inputsList.length; i < len; i++) {
            let el = inputsList[i];
            let inputValue = parseInt(el.value);
            if (el.hasAttribute("data-norune")) {
                if (inputValue !== this._configCurrentSection[el.name]) {
                    return true
                }
            } else {
                if (inputValue !== this._configCurrentSection.Runes[el.name]) {
                    return true;
                }
            }
        }

        return false;
    }


    _fillRunes() {
        const templateEl = document.querySelector("#content-template").content;
        let runeWrappersList = templateEl.querySelectorAll(".runes-wrapper");
        let elRunesWrapper = runeWrappersList[0];


        for (let i = 0, j = 0, len = this._runesList.length, col = Math.round(len / 6), col2i = col * 2, col3i = col * 3, col4i = col * 4, col5i = col * 5; i < len; i++) {
            const runeName = this._runesList[i];
            const runeNameToLowerCase = runeName.toLowerCase();
            const elRow = document.createElement("div");
            const elLabel = document.createElement("label");
            const wrapperEl = document.createElement("div");
            const elInput = document.createElement("input");
            const elImg = document.createElement("img");

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

            if (i % 6 === 0) {
                elRunesWrapper = runeWrappersList[j++];
            }

            elRunesWrapper.appendChild(elRow);
        }

    }

    _postData = async () => {

        let data = this._getData();

        await fetch("/save", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    };


    _requestReset = async () => {
        await fetch("/reset");
    };


    _getData() {
        const data = {
            location: this._locationsList[this._currentTabIndex],
            tabIndex: this._currentTabIndex,
            data: {
                keysAvailable: this._configCurrentSection.keysAvailable,
                Attempt: this._configCurrentSection.Attempt + 1,
                Keys: parseInt(this._currentTabEl.querySelector(`input[name=Keys]`).value),
                Nothings: parseInt(this._currentTabEl.querySelector(`input[name=Nothings]`).value),
                Deaths: parseInt(this._currentTabEl.querySelector(`input[name=Deaths]`).value),
                DeathsMe: parseInt(this._currentTabEl.querySelector(`input[name=DeathsMe]`).value),
                Runes: {}
            }
        };

        for (let i = 0, len = this._runesList.length; i < len; i++) {
            let runeName = this._runesList[i];
            data.data.Runes[runeName] = parseInt(this._currentTabEl.querySelector(`input[name=${runeName}]`).value);
        }

        return data;
    }

}

new App();