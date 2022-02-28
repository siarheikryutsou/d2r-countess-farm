const http = require("http");
const fs = require("fs").promises;
const url = require("url");
const path = require("path");
const host = "127.0.0.1";
const port = 3000;
const configFileName = "config.json";
const configDefaultFileName = "config_default.json";
const resultFileName = "countess.txt";

let indexFile;
let configFile;

const requestListener = (req, res) => {

	if (req.method === "POST") {
		let body = "";
		req.on("data", (data) => {
			body += data;
		});

		req.on("end", () => {
			updateConfig(body);
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
			".wav": "audio/wav",
			".mp3": "audio/mpeg",
			".svg": "image/svg+xml",
			".pdf": "application/pdf",
			".doc": "application/msword"
		};


		switch (req.url) {
			case "/config":
				res.setHeader("Content-Type", "application/json");
				res.writeHead(200);
				res.end(configFile.toString());
				break;
			case "/reset":
				resetConfig();
				res.writeHead(200, {"Content-Type": "text/html"});
				res.end("Success");
				break;
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

const readConfig = () => {
	fs.readFile(configFileName)
		.then(contents => {
			configFile = contents;
			parseConfig(configFile);
			readHtml();
		})
		.catch(err => {
			console.error(`Could not read ${configFileName} file: ${err}`);
			process.exit(1);
		});
};

updateConfig = (json) => {
	fs.writeFile(configFileName, json).then(() => {
		fs.readFile(configFileName)
			.then(contents => {
				configFile = contents;
				writeResult(JSON.parse(json));
			});
	});
};

const readHtml = () => {
	fs.readFile(__dirname + "/index.html")
		.then(contents => {
			indexFile = contents;
			server.listen(port, host, () => {
				console.log(`Server is running on http://${host}:${port}`);
			});
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
	let message = "Забег на каунтессу №" + json.Attempt + "\n\n";
	message += "Я умер раз: " + json.DeathsMe + "\n\n";
	message += "Мерк умер раз: " + json.Deaths + "\n\n";
	message += "Ключей: " + json.Keys + "\n\n";
	message += "Ни рун ни ключей: " + json.Nothings + "\n\n";
	message += "Руны:\n";

	for (let rune in json.Runes) {
		let count = json.Runes[rune];
		if (count) {
			message += rune + ": " + count + "\n";
		}
	}

	fs.writeFile(resultFileName, message);
};


const resetConfig = function () {
	fs.readFile(configDefaultFileName)
		.then(contents => {
			configFile = contents;
			parseConfig(configFile);
		});
};

readConfig();