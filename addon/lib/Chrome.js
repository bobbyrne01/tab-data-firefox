var {
	Cc, Ci, Cu
} = require("chrome");

exports.initMemoryReporterManager = function () {
	return Cc["@mozilla.org/memory-reporter-manager;1"].getService(Ci.nsIMemoryReporterManager);
};

exports.gc = function (panel) {
	Cu.schedulePreciseGC(
		function () {
			panel.port.emit('schedulePreciseGC', 'done');
		}
	);
};
