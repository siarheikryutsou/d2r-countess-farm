export class GameItemEl extends HTMLElement {

    constructor(isRune = false, itemName = "") {
        super();

        if (this.children.length) {
            //TODO: remove nahui
            return
        }

        //TODO: think no need this wrapper; Check after all items will be moved to this
        //const col = document.createElement("div");
        const label = document.createElement("label");
        const inputWrapper = document.createElement("div");
        const input = document.createElement("input");
        const img = document.createElement("img");
        const itemNameToLowerCase = itemName.toLowerCase();

        //col.classList.add("row");
        inputWrapper.classList.add("input-wrapper");

        label.textContent = itemName;
        label.setAttribute("for", itemNameToLowerCase);

        //input.value = ;
        input.type = "number";
        input.id = itemNameToLowerCase;
        input.name = itemName;
        if (!isRune) {
            input.setAttribute("data-norune", "true");
        }

        img.src = `static/img/${itemName}.png`;

        inputWrapper.append(input);
        inputWrapper.append(img);
        //col.append(label);
        //col.append(inputWrapper);
        this.append(label, inputWrapper)

        return this;
    }
}

customElements.define("game-item", GameItemEl);