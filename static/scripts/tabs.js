export class Tabs extends EventTarget {

    _buttons = null;
    _tabEls = null;
    _activeIndex = null;
    _activeTabDisplayStyle;

    constructor(buttons, tabEls, activeIndex = 0, activeTabDisplayStyle = "block") {
        super();
        this._buttons = buttons;
        this._tabEls = tabEls;
        this._activeIndex = activeIndex || 0;
        this._activeTabDisplayStyle = activeTabDisplayStyle;

        this._init();
    }

    _init() {
        for (let i = 0, len = this._tabEls.length; i < len; i++) {
            if (i !== this._activeIndex) {
                this._deactivateActiveTab(i);
            } else {
                this._activateTab(i);
            }

            this._buttons[i].addEventListener("click", this._onTabButtonClick.bind(this));
        }
    }


    _activateTab(index = this._activeIndex) {
        this._tabEls[index].style.display = this._activeTabDisplayStyle;
        this._buttons[index].disabled = true;
        this._activeIndex = index;
    }

    _deactivateActiveTab(index = this._activeIndex) {
        const tabEl = this._tabEls[index];
        const button = this._buttons[index];
        this._tabEls[index].style.display = "none";
        this._buttons[index].disabled = false;
    }


    _onTabButtonClick(event) {
        const changeEvent = new Event("change", {bubbles: true, cancelable: true});
        this.dispatchEvent(changeEvent);
        if (changeEvent.defaultPrevented) {
            return;
        }

        const index = this._getActiveIndexByButton(event.currentTarget);
        this._deactivateActiveTab();
        this._activeIndex = index;
        this._activateTab();
        this.dispatchEvent(new Event("changed"));
    }


    _getActiveIndexByButton(button) {
        for (let i = 0, len = this._buttons.length; i < len; i++) {
            if (button === this._buttons[i]) {
                return i;
            }
        }

        return -1;
    }

    get activeTabIndex() {
        return this._activeIndex;
    }

    set activeTabIndex(value) {
        this._buttons[value].click();
    }

}