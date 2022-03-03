export class App {
	
	_elBody = null;
	_elRunesWrapper;
	_btnSave = null;
	_btnReset = null;
	_inputTitle = null;
	_inputMerk = null;
	_inputMe = null;
	_inputNothing = null;
	_inputKeys;
	_runesList = [];
	_config;
	_inputsList;
	_changesWrapper;

	constructor() {
		document.addEventListener("DOMContentLoaded", this._onDomContentLoaded.bind(this), {once: true});
	}

	_onDomContentLoaded(event) {
		this._requestConfig().then(() => {
			this._init();
		});
	}


	_requestConfig = async () => {
		let response = await fetch("/config");
		this._config = await response.json();
	}


	_init() {
		this._runesList = Object.keys(this._config.Runes);
		this._btnSave = document.getElementById("btnSave");
		this._btnReset = document.getElementById("btnReset");
		this._inputTitle = document.getElementById("attempt");
		this._elRunesWrapper = document.getElementsByClassName("runes-wrapper")[0];
		this._inputKeys = document.getElementById("keys");
		this._inputMerk = document.getElementById("merk");
		this._inputMe = document.getElementById("me");
		this._inputNothing = document.getElementById("nothing");
		this._changesWrapper = document.getElementById("changes-wrapper");

		this._btnSave.disabled = true;

		this._inputTitle.textContent = "Забег на каунтессу №" + this._config.Attempt;

		this._inputMe.value = this._inputMe.min = this._config.DeathsMe.toString();
		this._inputMe.max = (this._config.DeathsMe + 1).toString();

		this._inputMerk.value = this._inputMerk.min = this._config.Deaths.toString();
		this._inputMerk.max = (this._config.Deaths + 1).toString();

		this._inputKeys.value = this._inputKeys.min = this._config.Keys.toString();

		this._inputNothing.value = this._inputNothing.min = this._config.Nothings.toString();
		this._inputNothing.max = (this._config.Nothings + 1).toString();


		this._fillRunes();

		this._btnSave.addEventListener("click", (event) => {
			this._btnSave.disabled = true;
			postData().then(() => {
				window.location.reload();
			});
		});

		this._inputMe.addEventListener("change", (event) => {
			this._inputMerk.value = (parseInt(this._inputMerk.value) + (parseInt(this._inputMe.value) > this._config.DeathsMe ? 1 : -1)).toString();
			this._inputMerk.dispatchEvent(new Event("change"));
		});


		this._btnReset.addEventListener("click", (event) => {

			if (confirm("Точно резетим?") === true) {
				this._btnReset.disabled = true;
				requestReset().then(() => {
					window.location.reload();
				})
			}
		});

		this._elBody = document.getElementsByTagName("body")[0];
		this._elBody.classList.remove("hidden");

		this._inputsList = document.querySelectorAll("input[type=number]");

		this._inputsList.forEach((el) => {
			el.addEventListener("change", (event) => { onInputChanged(event) });
		});

	}

	_onInputChanged(event) {
		const changed = hasChanges();
		if(changed) {
			addChanges(event.currentTarget);
		} else {
			removeChanges(event.currentTarget);
		}
		this._btnSave.disabled = !changed;
	}


	_addChanges(el) {
		const elName = el.name;
		let changeId = `data-${elName}`;
		let value = parseInt(el.value) - parseInt(el.hasAttribute('data-norune') ? this._config[elName] : this._config.Runes[elName]);
		let changeEl = this._changesWrapper.querySelector(`[${changeId}]`) || document.createElement('span');

		if(!value && changeEl.parentNode) {
			changeEl.remove();
			return;
		}

		changeEl.setAttribute(changeId, "");

		if(!this._changesWrapper.contains(changeEl)) {
			this._changesWrapper.append(changeEl);
		}

		changeEl.innerHTML = `(${el.labels[0].textContent}: ${value}); `;
	}


	_removeChanges(el) {
		this._changesWrapper.innerHTML = "";
	}


	_hasChanges() {
		for(let i = 0, len = this._inputsList.length; i < len; i++) {
			let el = this._inputsList[i];
			let inputValue = parseInt(el.value);
			if(el.hasAttribute("data-norune")) {
				if(inputValue !== this._config[el.name]) {
					return true
				}
			} else {
				if(inputValue !== this._config.Runes[el.name]) {
					return true;
				}
			}
		}

		return false;
	}


	_fillRunes() {
		for(let i = 0, len = this._runesList.length, col=Math.round(len/6), col2i = col*2, col3i = col*3, col4i=col*4, col5i=col*5; i < len; i++) {
			const runeName = this._runesList[i];
			const runeNameToLowerCase = runeName.toLowerCase();
			const configValue = this._config.Runes[runeName];
			const elRow = document.createElement("div");
			const elLabel = document.createElement("label");
			const wrapperEl = document.createElement("div");
			const elInput = document.createElement("input");
			const elImg = document.createElement("img");

			elLabel.setAttribute("for", runeNameToLowerCase);
			elLabel.textContent = runeName;

			elInput.type = "number";
			elInput.min = configValue.toString();
			elInput.id = runeNameToLowerCase;
			elInput.value = this._config.Runes[runeName];
			elInput.name = runeName;
			elImg.src = "static/img/" + runeName + ".png";
			wrapperEl.classList.add("input-wrapper");

			elRow.appendChild(elLabel);
			elRow.appendChild(wrapperEl);
			wrapperEl.appendChild(elInput);
			wrapperEl.appendChild(elImg);

			elRow.classList.add("row");

			if(i === col - 1) {
				this._elRunesWrapper = document.getElementsByClassName("runes-wrapper")[1];
			} else if(i === col2i) {
				this._elRunesWrapper = document.getElementsByClassName("runes-wrapper")[2];
			} else if(i === col3i) {
				this._elRunesWrapper = document.getElementsByClassName("runes-wrapper")[3];
			} else if(i === col4i) {
				this._elRunesWrapper = document.getElementsByClassName("runes-wrapper")[4];
			} else if(i === col5i) {
				this._elRunesWrapper = document.getElementsByClassName("runes-wrapper")[5];
			}
			this._elRunesWrapper.appendChild(elRow);
		}

	}

	_postData = async () => {

		let data = getData();

		await fetch("/save", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});
	}


	_requestReset = async () => {
		await fetch("/reset");
	}


	_getData() {
		const data = {
			Attempt: this._config.Attempt + 1,
			Keys: parseInt(this._inputKeys.value),
			Nothings: parseInt(this._inputNothing.value),
			Deaths: parseInt(this._inputMerk.value),
			DeathsMe: parseInt(this._inputMe.value),
			Runes: {}
		};

		for(let i = 0, len = this._runesList.length; i < len; i++) {
			let runeName = this._runesList[i];
			data.Runes[runeName] = parseInt(document.getElementById(runeName.toLowerCase()).value);
		}

		return data;
	}

}

new App();