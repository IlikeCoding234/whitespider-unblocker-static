import swreg from "./swreg.js";

// default error handler
window.onerror = (message, src, lineno, colno, error) => {
	alert(`Error at "${src}", line ${lineno}:${colno}: \n${error}`, "Error");
};

Array.prototype.remove = function(element) {
	for (let i = 0; i < this.length; i++) {
		if (this[i] == element)
			this.splice(i, 1);
	}
};

const storage = (() => {
	const base = {
		getItem: function (key, def) {
			let item = this[key];
			if (item == null)
				return this[key] = def;
			return item;
		},
		save: () => { }
	};

	try {
		const data = localStorage.getItem("data") || "{}";
		Object.assign(base, JSON.parse(data));
		base.save = function () {
			localStorage.setItem("data", JSON.stringify(this));
		};

		// autosave
		setInterval(() => {
			base.save();
		}, 10000);
	} catch(err) {
		alert("Local storage is disabled by your browser, your browsing data will not be saved.", "Warning");
	}

	return base;
})();

window.onbeforeunload = window.onunload = () => {
	storage.save();
};

const urlInput = document.getElementById("input");
const shortcutBar = document.getElementById("shortcut-bar");
const addShortcutButton = document.getElementById("add-shortcut");
const contextMenu = document.getElementById("context-menu");
const shortcutContextMenu = document.getElementById("shortcut-context-menu");
const googleSearch = "https://www.google.com/search?q=";
const googleSearchR = "https://www.google.com/search?btnI=Im+Feeling+Lucky&q=";
const shortcuts = storage.getItem("shortcuts", [
	{
		name: "Google",
		icon: "res/google.svg",
		link: "https://www.google.com/"
	},
	{
		name: "YouTube",
		icon: "res/youtube.svg",
		link: "https://www.youtube.com/"
	},
	{
		name: "Facebook",
		icon: "res/facebook.svg",
		link: "https://www.facebook.com"
	},
	{
		name: "Instagram",
		icon: "res/instagram.svg",
		link: "https://www.instagram.com"
	},
	{
		name: "TikTok",
		icon: "res/tiktok.svg",
		link: "https://www.tiktok.com/"
	},
	{
		name: "Y8",
		icon: "res/y8.svg",
		link: "https://www.y8.com"
	}
]);
const config = storage.getItem("config", {
	prefix: "/O0OO0O/",
	bare: "/bare/",
	bundle: "/uv/uv.bundle.js",
	handler: "/uv/uv.handler.js",
	sw: "/uv/uv.sw.js",
	reduceHistoryLogging: true
});
const coder=new function(){this.encode=e=>{e=function(e){if(e instanceof URL)return e.href;try{return new URL(e).href}catch(r){throw TypeError("Invalid URL: "+e)}}(e);let r=Array.from(e).map(((e,r)=>r%2?String.fromCharCode(127^e.charCodeAt(0)):e)).join("");return encodeURIComponent(r)},this.decode=e=>{let[r,...n]=e.split("?");return r=decodeURIComponent(r),Array.from(r).map(((e,r)=>r%2?String.fromCodePoint(127^e.charCodeAt(0)):e)).join("")+(n.length?"?"+n.join("?"):"")}};
config.encodeUrl = coder.encode;
config.decodeUrl = coder.decode;

// global property
Object.defineProperty(window, "swUrl", {
	configurable: false,
	enumerable: false,
	get: () => "/sw.js?config=" + encodeURIComponent(JSON.stringify(config))
});

if (swreg != null)
	swreg.tick(swUrl);
// else block(...);

function updateShortcuts() {
	shortcutBar.innerHTML = "";
	for (let i = 0; i < shortcuts.length; i++) {
		let s = shortcuts[i];
		let item = document.createElement("div");
		item.className = "shortcut-item";
		item.onclick = () => openUrl(s.link);
		item.oncontextmenu = (e) => {
			e.preventDefault();
			e.stopPropagation();
			shortcutContextMenu.style.top = e.clientY + "px";
			shortcutContextMenu.style.left = e.clientX + "px";
			shortcutContextMenu.style.display = "block";
			document.getElementById("delete-shortcut").onclick = () => {
				shortcuts.remove(s);
				updateShortcuts();
			};
			document.getElementById("edit-shortcut").onclick = async () => {
				let result = await form("", "Edit shortcut", [
					{
						label: "Name",
						input: {
							type: "text",
							placeholder: "Name",
							value: s.name
						}
					},
					{
						label: "URL",
						input: {
							type: "text",
							placeholder: "https://example.com/example",
							value: s.link
						}
					}
				]);

				if (result == null)
					return; // canceled

				let name = result[0].value;
				let url = result[1].value;

				if (name.length == 0) {
					alert("Name cannot be empty.");
					return;
				}

				if (url.length == 0) {
					alert("URL cannot be empty.");
					return;
				}

				try {
					url = new URL(url).href;
				} catch(e) {
					alert("Invalid URL. A valid URL must start with http:// or https://");
					return;
				}

				s.name = name;
				s.link = url;
				updateShortcuts();
			};
		};

		let icon = document.createElement("img");
		icon.className = "shortcut-item-icon";
		icon.width = 60;
		icon.height = 60;
		icon.src = s.icon;
		item.appendChild(icon);

		let text = document.createElement("text");
		text.className = "shortcut-item-text";
		text.innerHTML = s.name;

		item.appendChild(text);
		shortcutBar.appendChild(item);
	}
	shortcutBar.appendChild(addShortcutButton);
}
updateShortcuts();

urlInput.onkeydown = (e) => {
	if (e.keyCode == 13) {
		e.preventDefault();
		run(googleSearch, false);
	}
};
document.getElementById("search-button").onclick = () => {
	run(googleSearch, true);
};
document.getElementById("random-button").onclick = () => {
	run(googleSearchR, true);
};
document.getElementById("clear-site-data").onclick = async () => {
	window.sessionStorage.clear();
	window.localStorage.clear();
	let databases = await indexedDB.databases();
	for (let i = 0; i < databases.length; i++)
		indexedDB.deleteDatabase(databases[i].name);
};
document.getElementById("clear-cache").onclick = async () => {
	let keys = await caches.keys();
	for (let i = 0; i < keys.length; i++)
		await caches.delete(keys[i]);
};
document.getElementById("leave-without-history").onclick = () => {
	window.location.replace(new URL("https://google.com/"));
};
addShortcutButton.onclick = async () => {
	let result = await form("", "Add shortcut", [
		{
			label: "Name",
			input: {
				type: "text",
				placeholder: "Name"
			}
		},
		{
			label: "URL",
			input: {
				type: "text",
				placeholder: "https://example.com/example"
			}
		}
	]);

	if (result == null)
		return; // canceled

	let name = result[0].value;
	let url = result[1].value;

	if (name.length == 0) {
		alert("Name cannot be empty.");
		return;
	}

	if (url.length == 0) {
		alert("URL cannot be empty.");
		return;
	}

	try {
		url = new URL(url).href;
	} catch(e) {
		alert("Invalid URL. A valid URL must start with http:// or https://");
		return;
	}

	shortcuts.push({
		name: name,
		icon: (() => {
			let favicon = new URL(url);
			favicon.pathname = "/favicon.ico";
			favicon.search = "";
			return favicon.href;
		})(),
		link: url
	});

	updateShortcuts();
};

document.body.onclick = () => {
	contextMenu.style.display = "none";
	shortcutContextMenu.style.display = "none";
};
document.oncontextmenu = (e) => {
	e.preventDefault();
	contextMenu.style.top = e.clientY + "px";
	contextMenu.style.left = e.clientX + "px";
	contextMenu.style.display = "block";
};
document.getElementById("version").innerHTML = app.cacheVersion;
document.getElementById("settings").onclick = async () => {
	const result = await form("", "Settings", [
		{
			label: "Server address",
			input: {
				type: "text",
				value: config.bare
			}
		},
		{
			label: "Reduce history logging",
			input: {
				type: "checkbox",
				checked: config.reduceHistoryLogging
			},
			inline: true
		}
	]);

	if (result == null)
		return; // canceled

	config.bare = result[0].value;
	config.reduceHistoryLogging = result[1].checked;

	await swreg.updateServiceWorker(swUrl);
};

function isUrl(str) {
	try {
		return new URL(str).href;
	} catch(err) {
		return null;
	}
}

function isHostname(str) {
	let containsSlash = str.includes("/");
	if (containsSlash)
		str = str.substring(0, str.indexOf("/"));

	if (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^(?:(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){6})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:::(?:(?:(?:[0-9a-fA-F]{1,4})):){5})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){4})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,1}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){3})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,2}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){2})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,3}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:[0-9a-fA-F]{1,4})):)(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,4}(?:(?:[0-9a-fA-F]{1,4})))?::)(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,5}(?:(?:[0-9a-fA-F]{1,4})))?::)(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,6}(?:(?:[0-9a-fA-F]{1,4})))?::))))$/.test(str))
		return containsSlash || str.includes(".");
	return false;
}

function fixUrl(url, searchUrl, searchOnly) {
	url = url.replace(/^\s+|\s+$/gm, "");

	if (searchOnly)
		return searchUrl + encodeURIComponent(url);
	if (isUrl(url))
		return url;
	if (isHostname(url))
		return "https://" + url;

	return searchUrl + encodeURIComponent(url);
}

async function popup(url) {
	const frame = document.createElement("iframe");
	frame.setAttribute("type", "text/plain");
	frame.setAttribute("width", "1024");
	frame.setAttribute("height", "768");
	frame.setAttribute("loading", "eager");
	frame.setAttribute("allowfullscreen", "true");
	frame.setAttribute("allowtransparency", "true");
	frame.setAttribute("allow", "cross-origin-isolated");
	frame.setAttribute("fetchpriority", "high");

	await window.popup(frame, "_");

	frame.contentWindow.location = url;
}

function openLockerPopup() {
	const win = window.open("", "_blank", "popup=1,height=400,width=300,left=0,top=0");
	if (win != null) {
		win.focus();
		win.location = new URL(window.location.origin + "/lock.html?swurl=" + encodeURIComponent(swUrl));
	}
}

async function openUrl(url) {
	// ensure service worker registered
	const reg = await swreg.registerServiceWorker(swUrl);
	if (reg == null)
		return; // failed

	openLockerPopup();

	const encodedUrl = new URL(window.location.origin +  config.prefix + config.encodeUrl(url));
	if (config.reduceHistoryLogging)
		await popup(encodedUrl);
	else window.location = encodedUrl;
}

async function run(searchUrl, searchOnly) {
	await openUrl(fixUrl(urlInput.value, searchUrl, searchOnly));
}

export const locker = { lock: () => { /*****/ console.log("%cWhiteSpider.gq", "background-color:#001a1a;border:3px solid #008080;border-radius:10px;color:#ffffff;display:block;font-family:Ubuntu;font-size:24px;font-stretch:normal;font-style:normal;font-weight:600;height:fit-content;margin:10px;padding:10px;position:relative;text-align:start;text-decoration:none;width:fit-content");console.log("%cPage Verified", "position: relative;display: block;width: fit-content;height: fit-content;color: #ffffff;background-color: #008000;font-size: 14px;font-weight: 600;font-family: \"Ubuntu Mono\";font-stretch: normal;text-align: start;text-decoration: none;"); } };
