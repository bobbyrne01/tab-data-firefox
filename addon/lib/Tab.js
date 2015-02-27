var tabs = require("sdk/tabs"),
	ss = require("./SimpleStorage"),
	Preference = require("./Preference"),
	Panel = require("./Panel"),
	Chrome = require("./Chrome"),
	sessionCount = 0,
	currentCount = 0,
	markedTabs = [],
	memoryReporterManager,
	handleReport,
	finishReporting,
	obj,
	timeoutId,
	oldMemoryUsageOnTabTitles;

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

		var tree = '';

		if (path.indexOf('explicit/window-objects/top(') >= 0) {

			tree = 'explicit/window-objects/top(';
			parseUrl(tree, path, units, amount);

		} else if (path.indexOf('explicit/add-ons') >= 0) {

			tree = 'window-objects/top(';
			parseUrl(tree, path, units, amount);
		}
	};
}

function parseUrl(tree, path, units, amount) {

	if (path.indexOf(', id=') >= 0) {

		var marked = false,
			index = 0;

		for (var i = 0; i < markedTabs.length; i++) {
			if (JSON.parse(markedTabs[i]).url === path.split(', id=')[0].split(tree)[1]) {
				marked = true;
				index = i;
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
}

function initFinishReporting() {

	/*
	 * Callback for nsIMemoryReporterManager
	 */
	finishReporting = function () {

		var memoryDump = [];

		for each(var tab in tabs) {

			for (var j = 0; j < markedTabs.length; j++) {

				var repl = JSON.parse(markedTabs[j]).url.replace(/\\/g, "/");

				if (repl.indexOf(tab.url) >= 0) {

					if (JSON.parse(markedTabs[j]).amount >= (Preference.get('memoryCautionThreshold') * 1000000)) {
						//console.log('CAUTION! ' + tab.title + ': ' + JSON.parse(markedTabs[j]).amount);
					}

					memoryDump.push({
						Title: (tab.title.indexOf(': ') >= 0 ? tab.title.split(': ')[1] : tab.title),
						Memory: bytesToSize(JSON.parse(markedTabs[j]).amount),
						Url: tab.url
					});

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

		Panel.get().port.emit("memoryDump", JSON.stringify(memoryDump));
	};
}
