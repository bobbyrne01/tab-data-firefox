require("./Tab").init();
require("./ToggleButton").init();
require("./Panel").init();

let memoryReporterManager = Components.classes["@mozilla.org/memory-reporter-manager;1"].getService(Components.interfaces.nsIMemoryReporterManager);
var memoryUsed = memoryReporterManager.residentFast;
if (memoryUsed === undefined) {
	memoryUsed = memoryReporterManager.resident;
}
var VSizeMaxContiguous = memoryReporterManager.vsizeMaxContiguous;
