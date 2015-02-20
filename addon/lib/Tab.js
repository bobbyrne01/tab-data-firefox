var tabs = require("sdk/tabs"),
	ss = require("./SimpleStorage"),
	Preference = require("Preference"),
	sessionCount = 0,
	currentCount = 0,
	markedTabs = [],
	MemoryReporterManager,
	handleReport,
	finishReporting,
	obj;
const {
	Cc, Ci
} = require("chrome");


exports.init = function () {

	if (typeof ss.getGlobalCount() === 'undefined') {
		ss.setGlobalCount(0);
	}

	MemoryReporterManager = Cc["@mozilla.org/memory-reporter-manager;1"].getService(Ci.nsIMemoryReporterManager);

	handleReport = function (process, path, kind, units, amount, description) {

		if (path.indexOf('explicit/window-objects/top(') >= 0) {

			if (path.indexOf(', id=') >= 0) {

				var marked = false,
					index = 0;

				for (var i = 0; i < markedTabs.length; i++) {
					if (JSON.parse(markedTabs[i]).url === path.split(', id=')[0].split('explicit/window-objects/top(')[1]) {
						marked = true;
						index = i;
					}
				}

				if (!marked) {

					obj = JSON.stringify({
						url: path.split(', id=')[0].split('explicit/window-objects/top(')[1],
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
	};

	finishReporting = function () {
		for each(var tab in tabs) {

			for (var j = 0; j < markedTabs.length; j++) {

				var repl = JSON.parse(markedTabs[j]).url.replace(/\\/g, "/");

				if (repl.indexOf(tab.url) >= 0) {
					tab.title = bytesToSize(
							JSON.parse(markedTabs[j]).amount) + ': ' +
						(tab.title.indexOf('B: ') >= 0 ? tab.title.split('B: ')[1] : tab.title);
				}
			}
		}
	};

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

	if (Preference.get("memoryTracking")){
		require("sdk/timers").setTimeout(updateMemoryCounters, Preference.get("memoryInterval") * 1000);
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

function bytesToSize(bytes) {
	if (bytes === 0) return '0 Byte';
	var k = 1000;
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function updateMemoryCounters() {
	markedTabs = []; // reset memory counts
	MemoryReporterManager.getReports(handleReport, null, finishReporting, null, false);

	if (Preference.get("memoryTracking")){
		require("sdk/timers").setTimeout(updateMemoryCounters, Preference.get("memoryInterval") * 1000);
	}
}

exports.updateMemoryCounters = function () {
	updateMemoryCounters();
};
