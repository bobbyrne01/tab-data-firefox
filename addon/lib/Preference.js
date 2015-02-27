var preference = require("sdk/simple-prefs"),
	Tab = require("Tab");

/*
 * preference listeners
 */
exports.registerListener = function () {
	preference.on("memoryTracking", onPrefMemTrackChange);
	preference.on("memoryUsageOnTabTitles", onPrefMemPlacementChange);
};


/*
 * listeners cleanup
 */
exports.removeListener = function () {
	preference.removeListener("memoryTracking", onPrefMemTrackChange);
	preference.removeListener("memoryUsageOnTabTitles", onPrefMemPlacementChange);
};


/*
 * exported functions
 */
exports.get = function (name) {
	return preference.prefs[name];
};

exports.set = function (name, value) {
	preference.prefs[name] = value;
};


/*
 * local functions
 */
function onPrefMemTrackChange(name) {

	if (preference.prefs[name]) {
		Tab.updateMemoryCounters();
	}
}

function onPrefMemPlacementChange() {
	Tab.rollbackTitles();
	Tab.updateOldMemoryUsageOnTabTitles(preference.prefs.memoryUsageOnTabTitles);
	Tab.removeScheduledFunction();
	Tab.updateMemoryCounters();
}
