export class Tabs extends EventTarget {

    #buttons = null;
    #tabEls = null;
    #activeIndex = null;
    #activeTabDisplayStyle;

    constructor(buttons, tabEls, activeIndex = 0, activeTabDisplayStyle = "block") {
        super();
        this.#buttons = buttons;
        this.#tabEls = tabEls;
        this.#activeIndex = activeIndex || 0;
        this.#activeTabDisplayStyle = activeTabDisplayStyle;

        this.#init();
    }

    #init() {
        for (let i = 0, len = this.#tabEls.length; i < len; i++) {
            if (i !== this.#activeIndex) {
                this.#deactivateActiveTab(i);
            } else {
                this.#activateTab(i);
            }

            this.#buttons[i].addEventListener("click", this.#onTabButtonClick.bind(this));
        }
    }


    #activateTab(index = this.#activeIndex) {
        this.#tabEls[index].style.display = this.#activeTabDisplayStyle;
        this.#buttons[index].disabled = true;
        this.#activeIndex = index;
    }

    #deactivateActiveTab(index = this.#activeIndex) {
        this.#tabEls[index].style.display = "none";
        this.#buttons[index].disabled = false;
    }


    #onTabButtonClick(event) {
        const changeEvent = new Event("change", {bubbles: true, cancelable: true});
        this.dispatchEvent(changeEvent);
        if (changeEvent.defaultPrevented) {
            return;
        }

        const index = this.#getActiveIndexByButton(event.currentTarget);
        this.#deactivateActiveTab();
        this.#activeIndex = index;
        this.#activateTab();
        this.dispatchEvent(new Event("changed"));
    }


    #getActiveIndexByButton(button) {
        for (let i = 0, len = this.#buttons.length; i < len; i++) {
            if (button === this.#buttons[i]) {
                return i;
            }
        }
        return -1;
    }

    get activeTabIndex() {
        return this.#activeIndex;
    }

    set activeTabIndex(value) {
        this.#buttons[value].click();
    }

    disable() {
        this.#buttons.forEach((button, index) => {
            if (index !== this.#activeIndex) {
                button.classList.add("disabled-by-router");
            }
            button.disabled = true;
        });
    }

    enable() {
        this.#buttons.forEach((button, index) => {
            button.classList.remove("disabled-by-router");
            if (index !== this.#activeIndex) {
                button.disabled = false;
            }
        });
    }

}