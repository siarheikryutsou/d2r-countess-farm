const http = require("http");
const fs = require("fs").promises;
const url = require("url");
const path = require("path");
const host = /*"0.0.0.0";*/"127.0.0.1";
const port = 3000;
const configFileName = "config.json";
const configDefaultFileName = "config_default.json";
const resultFileName = "result.txt";

let indexFile;
let configFile;

const requestListener = (req, res) => {

	if (req.method === "POST") {
		let body = "";
		req.on("data", (data) => {
			body += data;
		});

		req.on("end", () => {
			switch (req.url) {
				case "/save": {
					updateConfig(body);
					break;
				}
				case "/save_router_state": {
					updateRouterState(body);
					break;
				}
			}
			res.writeHead(200, {"Content-Type": "text/html"});
			res.end("Success");
		});
	} else if (req.method === "GET") {

		const parsedUrl = url.parse(req.url);
		const pathname = `${parsedUrl.pathname}`;
		const ext = path.parse(pathname).ext;

		const map = {
			".ico": "image/x-icon",
			".html": "text/html",
			".js": "text/javascript",
			".json": "application/json",
			".css": "text/css",
			".png": "image/png",
			".jpg": "image/jpeg",
			".svg": "image/svg+xml",
			".ttf": "application/octet-stream"
		};


		switch (req.url) {
			case "/config":
				res.setHeader("Content-Type", "application/json");
				res.writeHead(200);
				res.end(configFile.toString());
				break;
			case "/reset":
				fs.rm(configFileName)
					.then(() => {
						createNewConfig();
						res.writeHead(200, {"Content-Type": "text/html"});
						res.end("Success");
					});
				break;
			case "/backup": {
				fs.readFile(configFileName)
					.then((config) => {
						const regexp = /,\s|:|\s/g;
						const dateCreation = new Date(JSON.parse(config.toString()).dateCreation).toGMTString().replaceAll(regexp, "_");
						const now = new Date().toGMTString().replaceAll(regexp, "_");
						const backupFileName = `backup_${dateCreation}---${now}.json`;
						fs.copyFile(configFileName, backupFileName).then(() => {
							console.log(`Backuo ${backupFileName} created.`);
							res.writeHead(200, {"Content-Type": "text/html"});
							res.end("Success");
						})
					});
				break;
			}
			case "/":
				res.setHeader("Content-Type", "text/html");
				res.writeHead(200);
				res.end(indexFile);
				break;
			case "/favicon.ico":
				break;
			default:
				fs.readFile(__dirname + pathname)
					.then((data) => {
						res.setHeader("Content-type", map[ext] || "text/plain");
						res.end(data);
					})
					.catch(err => {
						console.error(`Could not read ${pathname} file: ${err}`);
						process.exit(1);
					});
				break;
		}
	}
};

const server = http.createServer(requestListener);

const initConfig = () => {
	fs.readFile(configFileName)
		.then(contents => {
			configFile = contents;
			parseConfig(configFile);
			readHtml();
		})
		.catch((err) => {
			if (err.code === "ENOENT") {
				//no config
				createNewConfig();
			} else {
				console.error(`Could not read ${configFileName} file: ${err}`);
				process.exit(1);
			}
		});
};

const createNewConfig = () => {
	readDefaultConfig().then((contents) => {
		const defaultConfigJson = JSON.parse(contents.toString());
		const locationsList = defaultConfigJson.locations;
		const tabIndex = defaultConfigJson.tabIndex;
		const resultData = {tabIndex: tabIndex, data: {}, dateCreation: new Date()};
		for (let i = 0, len = locationsList.length; i < len; i++) {
			const locationName = locationsList[i];
			resultData.data[locationName] = Object.assign({keysAvailable: ["Countess", "Summoner", "Nihlathak"].indexOf(locationName) !== -1}, defaultConfigJson.data);
		}

		fs.appendFile(configFileName, JSON.stringify(resultData)).then(() => {
			onNewConfigCreated();
		});
	});
};

const onNewConfigCreated = () => {
	console.log("Config created");
	initConfig();
};

const updateConfig = (requestBody) => {
	const requestBodyJson = JSON.parse(requestBody);
	const currentConfigJson = JSON.parse(configFile.toString());
	const date = new Date();
	const locale = "ru-RU";

	currentConfigJson.tabIndex = requestBodyJson.tabIndex;
	currentConfigJson.data[requestBodyJson.location] = requestBodyJson.data;
	currentConfigJson.lastSave = `${requestBodyJson.location} — ${date.toLocaleDateString(locale)} (${date.toLocaleTimeString("ru-RU")})`;

	fs.writeFile(configFileName, JSON.stringify(currentConfigJson)).then(() => {
		fs.readFile(configFileName)
			.then((contents) => {
				configFile = contents;
				writeResult(currentConfigJson);
			});
	});
};


const updateRouterState = (requestBody) => {
	const requestJson = JSON.parse(requestBody);
	const currentConfigJson = JSON.parse(configFile.toString());

	currentConfigJson.routePlanner = requestJson;

	if(requestJson) {
		currentConfigJson.tabIndex = requestJson.activeLocationIndex;
	}

	fs.writeFile(configFileName, JSON.stringify(currentConfigJson)).then(() => {
		fs.readFile(configFileName)
			.then((contents) => {
				configFile = contents;
			});
	});

}

const readHtml = () => {
	if (indexFile) return;
	fs.readFile(__dirname + "/index.html")
		.then((contents) => {
			indexFile = contents;
			startServer();
		})
		.catch(err => {
			console.error(`Could not read index.html file: ${err}`);
			process.exit(1);
		});
};


const parseConfig = (configFile) => {
	let json = JSON.parse(configFile.toString());
	writeResult(json);
};


const writeResult = (json) => {
	const location = Object.keys(json.data)[json.tabIndex];
	const data = json.data[location];

	let message = `Забег на ${location} #${data.Attempt}\n\n`;
	message += `Я умер раз: ${data.DeathsMe}\n\n`;
	message += `Мерк умер раз: ${data.Deaths}\n\n`;
	message += `Ничего: ${data.Nothings}\n\n`;
	message += `Ключей: ${data.Keys}\n\n`;
	message += `Скиллеров: ${data.Skillers}\n\n`;
	message += `Норм чарм: ${data.Charms}\n\n`;
	message += `Уников: ${data.Uniques}\n\n`;
	message += `Сетовых: ${data.Sets}\n\n`;
	message += `Руны:\n`;

	for (let rune in data.Runes) {
		let count = data.Runes[rune];
		if (count) {
			message += `${rune}: ${count}\n`;
		}
	}

	fs.writeFile(resultFileName, message);
};


const startServer = () => {
	server.listen(port, host, () => {
		console.log(`Server is running on http://${host}:${port}`);
	});
};


const readDefaultConfig = () => {
	return fs.readFile(configDefaultFileName);
};

initConfig();