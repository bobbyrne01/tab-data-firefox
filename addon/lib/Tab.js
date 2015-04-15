var tabs = require("sdk/tabs"),
	ss = require("./SimpleStorage"),
	Preference = require("./Preference"),
	Panel = require("./Panel"),
	Chrome = require("./Chrome"),
	WindowUtils = require("./WindowUtils"),
	Button = require("./ToggleButton"),
	sessionCount = 0,
	currentCount = 0,
	markedTabs = [],
	memoryReporterManager,
	handleReport,
	finishReporting,
	obj,
	timeoutId,
	oldMemoryUsageOnTabTitles,
	graphData = {},
	colors = [],
	colorIndex = 0,
	red = {
		r: 255,
		g: 0,
		b: 0,
		used: false
	},
	green = {
		r: 0,
		g: 255,
		b: 0,
		used: false
	},
	blue = {
		r: 0,
		g: 0,
		b: 255,
		used: false
	},
	yellow = {
		r: 255,
		g: 153,
		b: 0,
		used: false
	},
	black = {
		r: 0,
		g: 0,
		b: 0,
		used: false
	};


/*
 * Exported functions
 */
exports.init = function () {

	oldMemoryUsageOnTabTitles = parseInt(Preference.get("memoryUsageOnTabTitles"));

	if (typeof ss.getGlobalCount() === 'undefined') {
		ss.setGlobalCount(0);
	}

	// create callbacks for nsIMemoryReporterManager.getReports()
	memoryReporterManager = Chrome.initMemoryReporterManager();
	initHandleReport();
	initFinishReporting();

	for each(var tab in tabs) {
		ss.setGlobalCount(ss.getGlobalCount() + 1, new Date().getTime());
		sessionCount++;
		currentCount++;
	}

	// Listen for tab openings.
	tabs.on('open', function onOpen(tab) {
		ss.setGlobalCount(ss.getGlobalCount() + 1, new Date().getTime());
		sessionCount++;
		currentCount++;
	});

	//Listen for tab closes.
	tabs.on('close', function onOpen(tab) {
		currentCount--;
	});

	if (Preference.get("memoryTracking")) {
		timeoutId = require("sdk/timers").setTimeout(updateMemoryCounters, Preference.get("memoryInterval") * 1000);
	}

	graphData.labels = [];
	graphData.datasets = [];
	colors.push(red);
	colors.push(green);
	colors.push(blue);
	colors.push(yellow);
	colors.push(black);
};

exports.getGlobalCount = function () {
	return ss.getGlobalCount();
};

exports.getSessionCount = function () {
	return sessionCount;
};

exports.getCurrentCount = function () {
	return currentCount;
};

exports.rollbackTitles = function () {

	for each(var tab in tabs) {

		if (oldMemoryUsageOnTabTitles === 0) {

			tab.title = (tab.title.indexOf(': ') >= 0 ? tab.title.split(': ')[1] : tab.title);

		} else if (oldMemoryUsageOnTabTitles === 1) {

			tab.title = (tab.title.indexOf(': ') >= 0 ? tab.title.split(': ')[0] : tab.title);
		}
	}
};

exports.removeScheduledFunction = function () {
	require("sdk/timers").clearTimeout(timeoutId);
};

exports.reinitTimeout = function () {
	timeoutId = require("sdk/timers").setTimeout(updateMemoryCounters, Preference.get("memoryInterval") * 1000);
};

exports.updateOldMemoryUsageOnTabTitles = function (value) {
	oldMemoryUsageOnTabTitles = value;
};

exports.updateMemoryCounters = function () {
	updateMemoryCounters();
};


/*
 * Local functions
 */
function bytesToSize(bytes) {
	if (bytes === 0) return '0 Byte';
	var k = 1000;
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function updateMemoryCounters() {

	Button.get().badgeColor = "#99FF66";

	markedTabs = []; // reset memory counts
	memoryReporterManager.getReports(handleReport, null, finishReporting, null, false);

	if (Preference.get("memoryTracking")) {
		timeoutId = require("sdk/timers").setTimeout(updateMemoryCounters, Preference.get("memoryInterval") * 1000);
	}
}

function initHandleReport() {

	/*
	 * Callback for nsIMemoryReporterManager
	 */
	handleReport = function (process, path, kind, units, amount, description) {

		if (path.indexOf('explicit/window-objects/top(') >= 0 && path.indexOf(', id=') >= 0) {

			parseUrl('explicit/window-objects/top(', path, units, amount);

		} else if (path.indexOf('explicit/add-ons') >= 0 && path.indexOf(', id=') >= 0) {

			parseUrl('window-objects/top(', path, units, amount);
		}
	};
}

function parseUrl(tree, path, units, amount) {

	var marked = false,
		index = 0;

	for (var i = 0; i < markedTabs.length; i++) {
		if (JSON.parse(markedTabs[i]).url === path.split(', id=')[0].split(tree)[1]) {
			marked = true;
			index = i;
			break;
		}
	}

	if (!marked) {

		obj = JSON.stringify({
			url: path.split(', id=')[0].split(tree)[1],
			units: units,
			amount: amount
		});

		markedTabs.push(obj);

	} else {

		obj = JSON.parse(markedTabs[index]);
		obj.amount = obj.amount + amount;

		markedTabs[index] = JSON.stringify({
			url: obj.url,
			units: obj.units,
			amount: obj.amount
		});
	}
}

function compare(a, b) {
	return b.data[4] - a.data[4];
}

function initFinishReporting() {

	/*
	 * Callback for nsIMemoryReporterManager
	 */
	finishReporting = function () {

		var memoryDump = [];

		// only 5 datasets on chart can exist at a time
		if (graphData.labels.length === 5) {
			graphData.labels.splice(0, 1);
		}

		var date = new Date();
		graphData.labels.push(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());

		// for any tab
		for each(var tab in tabs) {

			// which we've collected mem data
			for (var j = 0; j < markedTabs.length; j++) {

				var repl = JSON.parse(markedTabs[j]).url.replace(/\\/g, "/");

				if (repl.indexOf(tab.url) >= 0) {

					if (JSON.parse(markedTabs[j]).amount >= (Preference.get('memoryCautionThreshold') * 1000000)) {

						styleTab(repl, 'red');

					} else {

						styleTab(repl, '');
					}

					// format data for panel
					memoryDump.push({
						Title: (tab.title.indexOf(': ') >= 0 ? tab.title.split(': ')[1] : tab.title),
						Memory: bytesToSize(JSON.parse(markedTabs[j]).amount),
						Url: tab.url
					});

					var init = true;

					// format data for chart
					for (var k = 0; k < graphData.datasets.length; k++) {

						if (graphData.datasets[k].label === memoryDump[memoryDump.length - 1].Title) {

							if (graphData.datasets[k].data.length === 5) {
								graphData.datasets[k].data.shift();
							}

							graphData.datasets[k].data.push((JSON.parse(markedTabs[j]).amount / 1000000).toFixed(2));

							init = false;
							break;
						}
					}

					if (init) {

						var nextColor;

						if (graphData.datasets.length <= 4) {

							for (var d = 0; d < colors.length; d++) {
								if (!colors[d].used) {
									nextColor = colors[d];
								}
							}

							graphData.datasets.push({
								label: memoryDump[memoryDump.length - 1].Title,
								fillColor: "rgba(" + nextColor.r + "," + nextColor.g + "," + nextColor.b + ",0.2)",
								strokeColor: "rgba(" + nextColor.r + "," + nextColor.g + "," + nextColor.b + ",1)",
								pointColor: "rgba(" + nextColor.r + "," + nextColor.g + "," + nextColor.b + ",1)",
								pointStrokeColor: "#fff",
								pointHighlightFill: "#fff",
								pointHighlightStroke: "rgba(" + nextColor.r + "," + nextColor.g + "," + nextColor.b + ",1)",
								data: [0, 0, 0, 0, (JSON.parse(markedTabs[j]).amount / 1000000).toFixed(2)],
								color: nextColor
							});

							nextColor.used = true;

						} else {

							if ((JSON.parse(markedTabs[j]).amount / 1000000) > graphData.datasets[4].data[4]) {

								nextColor = graphData.datasets[4].color;
								graphData.datasets.splice(4, 1);

								graphData.datasets.push({
									label: memoryDump[memoryDump.length - 1].Title,
									fillColor: "rgba(" + nextColor.r + "," + nextColor.g + "," + nextColor.b + ",0.2)",
									strokeColor: "rgba(" + nextColor.r + "," + nextColor.g + "," + nextColor.b + ",1)",
									pointColor: "rgba(" + nextColor.r + "," + nextColor.g + "," + nextColor.b + ",1)",
									pointStrokeColor: "#fff",
									pointHighlightFill: "#fff",
									pointHighlightStroke: "rgba(" + nextColor.r + "," + nextColor.g + "," + nextColor.b + ",1)",
									data: [0, 0, 0, 0, (JSON.parse(markedTabs[j]).amount / 1000000).toFixed(2)],
									color: nextColor
								});
							}
						}
					}

					// sort datasets, highest amount to lowest
					graphData.datasets.sort(compare);

					// update tab title with mem usage
					if (Preference.get("memoryUsageOnTabTitles") === 0) {

						tab.title = bytesToSize(
								JSON.parse(markedTabs[j]).amount) + ': ' +
							(tab.title.indexOf('B: ') >= 0 ? tab.title.split('B: ')[1] : tab.title);

					} else if (Preference.get("memoryUsageOnTabTitles") === 1) {

						tab.title = (tab.title.indexOf(': ') >= 0 ? tab.title.split(': ')[0] : tab.title) +
							': ' + bytesToSize(JSON.parse(markedTabs[j]).amount);
					}
				}
			}
		}

		// remove datasets for urls which are no longer open in browser
		var deletes = [];

		for (var a = 0; a < graphData.datasets.length; a++) {

			var deleted = true;

			for (var l = 0; l < memoryDump.length; l++) {

				if (graphData.datasets[a].label === memoryDump[l].Title) {
					deleted = false;
				}
			}

			if (deleted) {
				deletes.push(a);
			}
		}

		for (var m = 0; m < deletes.length; m++) {
			for (var n = 0; n < colors.length; n++) {
				if (colors[n] === graphData.datasets[(deletes[m] - m)].color) {
					colors[n].used = false;
				}
			}

			graphData.datasets.splice((deletes[m] - m), 1);
		}

		// send memory data to Panel contentScript
		var payload = JSON.stringify({
			memoryDump: memoryDump,
			graphData: JSON.stringify(graphData)
		});

		Button.get().badgeColor = "#FF5050";

		Panel.get().port.emit("memoryDump", payload);
	};
}

function styleTab(currentUrl, color) {

	var allWindows = WindowUtils.getWindows();

	for (var h = 0; h < allWindows.length; h++) { // loop all windows

		if (allWindows[h].gBrowser && allWindows[h].gBrowser.tabContainer) {
			var browserTabs = allWindows[h].gBrowser.tabContainer.childNodes;

			for (var q = 0; q < browserTabs.length; q++) { // loop all tabs within window

				var browser = allWindows[h].gBrowser.getBrowserForTab(browserTabs[q]);

				if (currentUrl === browser.currentURI.spec) {

					browserTabs[q].style.color = color;
				}
			}
		}
	}
}
