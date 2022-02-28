(function() {

	let elBody;
	let elRunesWrapper;
	let btnSave = null;
	let btnReset = null;
	let inputTitle = null;
	let inputMerk = null;
	let inputMe = null;
	let inputNothing = null;
	let inputKeys;
	let runesList = [];
	let config;
	let inputsList;
	let changesWrapper;

	function onDomContentLoaded(event) {
		requestData().then(() => {
			init();
		});
	}


	async function requestData() {
		let response = await fetch("/config");
		config = await response.json();
	}


	function init() {
		runesList = Object.keys(config.Runes);
		btnSave = document.getElementById("btnSave");
		btnReset = document.getElementById("btnReset");
		inputTitle = document.getElementById("attempt");
		elRunesWrapper = document.getElementsByClassName("runes-wrapper")[0];
		inputKeys = document.getElementById("keys");
		inputMerk = document.getElementById("merk");
		inputMe = document.getElementById("me");
		inputNothing = document.getElementById("nothing");
		changesWrapper = document.getElementById("changes-wrapper");

		btnSave.disabled = true;

		inputTitle.textContent = "Забег на каунтессу №" + config.Attempt;

		inputMe.value = inputMe.min = config.DeathsMe.toString();
		inputMe.max = (config.DeathsMe + 1).toString();

		inputMerk.value = inputMerk.min = config.Deaths.toString();
		inputMerk.max = (config.Deaths + 1).toString();

		inputKeys.value = inputKeys.min = config.Keys.toString();

		inputNothing.value = inputNothing.min = config.Nothings.toString();
		inputNothing.max = (config.Nothings + 1).toString();


		fillRunes();

		btnSave.addEventListener("click", (event) => {
			btnSave.disabled = true;
			postData().then(() => {
				window.location.reload();
			});
		});

		inputMe.addEventListener("change", (event) => {
			inputMerk.value = (parseInt(inputMerk.value) + (parseInt(inputMe.value) > config.DeathsMe ? 1 : -1)).toString();
			inputMerk.dispatchEvent(new Event("change"));
		});


		btnReset.addEventListener("click", (event) => {

			if (confirm("Точно резетим?") === true) {
				btnReset.disabled = true;
				requestReset().then(() => {
					window.location.reload();
				})
			}
		});

		elBody = document.getElementsByTagName("body")[0];
		elBody.classList.remove("hidden");

		inputsList = document.querySelectorAll("input[type=number]");

		inputsList.forEach((el) => {
			el.addEventListener("change", (event) => { onInputChanged(event) });
		});

	}

	function onInputChanged(event) {
		const changed = hasChanges();
		if(changed) {
			addChanges(event.currentTarget);
		} else {
			removeChanges(event.currentTarget);
		}
		btnSave.disabled = !changed;
	}


	function addChanges(el) {
		const elName = el.name;
		let changeId = `data-${elName}`;
		let value = parseInt(el.value) - parseInt(el.hasAttribute('data-norune') ? config[elName] : config.Runes[elName]);
		let changeEl = changesWrapper.querySelector(`[${changeId}]`) || document.createElement('span');

		if(!value && changeEl.parentNode) {
			changeEl.remove();
			return;
		}

		changeEl.setAttribute(changeId, "");

		if(!changesWrapper.contains(changeEl)) {
			changesWrapper.append(changeEl);
		}

		changeEl.innerHTML = `(${el.labels[0].textContent}: ${value}); `;
	}


	function removeChanges(el) {
		changesWrapper.innerHTML = "";
	}


	function hasChanges() {
		for(let i = 0, len = inputsList.length; i < len; i++) {
			let el = inputsList[i];
			let inputValue = parseInt(el.value);
			if(el.hasAttribute("data-norune")) {
				if(inputValue !== config[el.name]) {
					return true
				}
			} else {
				if(inputValue !== config.Runes[el.name]) {
					return true;
				}
			}
		}

		return false;
	}


	function fillRunes() {
		for(let i = 0, len = runesList.length, col=Math.round(len/6), col2i = col*2, col3i = col*3, col4i=col*4, col5i=col*5; i < len; i++) {
			const runeName = runesList[i];
			const runeNameToLowerCase = runeName.toLowerCase();
			const configValue = config.Runes[runeName];
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
			elInput.value = config.Runes[runeName];
			elInput.name = runeName;
			elImg.src = "static/img/" + runeName + ".png";
			wrapperEl.classList.add("input-wrapper");

			elRow.appendChild(elLabel);
			elRow.appendChild(wrapperEl);
			wrapperEl.appendChild(elInput);
			wrapperEl.appendChild(elImg);

			elRow.classList.add("row");

			if(i === col - 1) {
				elRunesWrapper = document.getElementsByClassName("runes-wrapper")[1];
			} else if(i === col2i) {
				elRunesWrapper = document.getElementsByClassName("runes-wrapper")[2];
			} else if(i === col3i) {
				elRunesWrapper = document.getElementsByClassName("runes-wrapper")[3];
			} else if(i === col4i) {
				elRunesWrapper = document.getElementsByClassName("runes-wrapper")[4];
			} else if(i === col5i) {
				elRunesWrapper = document.getElementsByClassName("runes-wrapper")[5];
			}
			elRunesWrapper.appendChild(elRow);
		}

	}

	async function postData() {

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


	async function requestReset() {
		await fetch("/reset");
	}


	function getData() {
		const data = {
			Attempt: config.Attempt + 1,
			Keys: parseInt(inputKeys.value),
			Nothings: parseInt(inputNothing.value),
			Deaths: parseInt(inputMerk.value),
			DeathsMe: parseInt(inputMe.value),
			Runes: {}
		};

		for(let i = 0, len = runesList.length; i < len; i++) {
			let runeName = runesList[i];
			data.Runes[runeName] = parseInt(document.getElementById(runeName.toLowerCase()).value);
		}

		return data;
	}

	document.addEventListener("DOMContentLoaded", onDomContentLoaded, {once: true});

})();