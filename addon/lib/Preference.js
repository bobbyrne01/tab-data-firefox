var preference = require("sdk/simple-prefs"),
	Tab = require("Tab");

function onPrefChange(name) {

	if (preference.prefs[name]) {
		Tab.updateMemoryCounters();
	}
}

exports.registerListener = function () {
	preference.on("memoryTracking", onPrefChange);
};

exports.get = function (name) {
	return preference.prefs[name];
};
exports.set = function (name, value) {
	preference.prefs[name] = value;
};
