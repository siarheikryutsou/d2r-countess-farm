export class GameItemEl extends HTMLElement {

    #name;
    #input;

    constructor(isRune = false, name = "") {
        super();

        const label = document.createElement("label");
        const inputWrapper = document.createElement("div"); //TODO: think about remove this wrapper
        const input = this.#input = document.createElement("input");
        const img = document.createElement("img");
        const nameToLowerCase = name.toLowerCase();

        inputWrapper.classList.add("input-wrapper");

        label.textContent = name;
        label.setAttribute("for", nameToLowerCase);

        //input.value = ;
        input.type = "number";
        input.id = nameToLowerCase;
        input.name = this.#name = name;
        if (!isRune) {
            //TODO: think about remove it
            input.setAttribute("data-norune", "true");
        }

        img.src = `static/img/${name}.png`;

        inputWrapper.append(input);
        inputWrapper.append(img);
        this.append(label, inputWrapper)

        return this;
    }

    get name() {
        return this.#name;
    }

    get value() {
        return parseInt(this.#input.value);
    }

    setData(value) {
        this.#input.value = this.#input.min = value;
    }
}

customElements.define("game-item", GameItemEl);