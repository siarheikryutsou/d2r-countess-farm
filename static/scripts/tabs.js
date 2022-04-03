export class Tabs extends EventTarget {

    #buttons;
    #tabEls;
    #activeIndex;
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
        for (let i = 0, len = this.#buttons.length; i < len; i++) {
            if (i !== this.#activeIndex) {
                this.#deactivateActiveTab(i);
            } else {
                this.#activateTab(i);
            }

            this.#buttons[i].addEventListener("click", this.#onTabButtonClick.bind(this));
        }
    }


    #activateTab(index = this.#activeIndex) {
        if (this.#tabEls) {
            this.#tabEls[index].style.display = this.#activeTabDisplayStyle;
        }
        this.#buttons[index].disabled = true;
        this.#activeIndex = index;
    }

    #deactivateActiveTab(index = this.#activeIndex) {
        if (this.#tabEls) {
            this.#tabEls[index].style.display = "none";
        }
        this.#buttons[index].disabled = false;
    }


    #onTabButtonClick(event) {
        const button = event.currentTarget;
        const changeEvent = new Event("change", {bubbles: true, cancelable: true});
        button.parentNode.dispatchEvent(changeEvent);
        if (changeEvent.defaultPrevented) {
            return;
        }

        const index = this.#getActiveIndexByButton(event.currentTarget);
        this.#deactivateActiveTab();
        this.#activeIndex = index;
        this.#activateTab();
        button.parentNode.dispatchEvent(new Event("changed"));
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


    get node() {
        return this.#buttons[0]
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