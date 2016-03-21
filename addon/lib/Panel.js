var Panel = require("sdk/panel"),
	Tab = require("./Tab"),
	Data = require("./Data"),
	Button = require("./ToggleButton"),
	Preference = require("./Preference"),
	Chrome = require("./Chrome"),
	panel;

exports.init = function () {

	panel = Panel.Panel({
		width: parseInt(Preference.get("panelWidth")),
		height: parseInt(Preference.get("panelHeight")),
		contentURL: Data.get("html/view.html"),
		contentScriptFile: [
			Data.get("bower_components/Chart.js/Chart.min.js"),
			Data.get("js/helper.js"),
			Data.get("js/controller.js")
		],
		onShow: function () {

			var stats = JSON.stringify({
				globalCount: Tab.getGlobalCount(),
				sessionCount: Tab.getSessionCount(),
				currentCount: Tab.getCurrentCount(),
				memoryTracking: Preference.get("memoryTracking"),
				memoryInterval: Preference.get("memoryInterval"),
				memoryFormat: Preference.get("memoryFormat"),
				memoryUsageOnTabTitles: Preference.get("memoryUsageOnTabTitles"),
				memoryUrlInUsage: Preference.get("memoryUrlInUsage"),
				memoryCautionThreshold: Preference.get("memoryCautionThreshold"),
				panelWidth: Preference.get("panelWidth"),
				panelHeight: Preference.get("panelHeight"),
				graphType: Preference.get("graphType")
			});

			panel.port.emit("stats", stats);
		},
		onHide: function () {
			Button.get().state('window', {
				checked: false
			});
		}
	});

	panel.port.on("memoryTracking", function (value) {
		Preference.set('memoryTracking', value);

		if (!Preference.get('memoryTracking')) {
			Tab.removeScheduledFunction();
			Tab.rollbackTitles();
		}
	});

	panel.port.on("memoryInterval", function (value) {
		Preference.set('memoryInterval', value);
		Tab.removeScheduledFunction();
		Tab.reinitTimeout();
	});

	panel.port.on("memoryUsageOnTabTitles", function (value) {
		Preference.set('memoryUsageOnTabTitles', parseInt(value));
	});

	panel.port.on("memoryFormat", function (value) {
		Preference.set('memoryFormat', parseInt(value));
		Tab.removeScheduledFunction();
		Tab.updateMemoryCounters();
	});

	panel.port.on("memoryUrlInUsage", function (value) {
		Preference.set('memoryUrlInUsage', value);
		Tab.removeScheduledFunction();
		Tab.updateMemoryCounters();
	});

	panel.port.on("memoryCautionThreshold", function (value) {
		Preference.set('memoryCautionThreshold', value);
	});

	panel.port.on("schedulePreciseGC", function (value) {
		Chrome.gc(panel);
	});

	panel.port.on("getMemoryUsage", function (value) {
		Tab.removeScheduledFunction();
		Tab.reinitTimeout();
		Tab.updateMemoryCounters();
		panel.port.emit('getMemoryUsage', '');
	});

	panel.port.on("panelWidth", function (value) {
		Preference.set('panelWidth', value);
		panel.resize(
			parseInt(Preference.get("panelWidth")),
			parseInt(Preference.get("panelHeight")));
	});

	panel.port.on("panelHeight", function (value) {
		Preference.set('panelHeight', value);
		panel.resize(
			parseInt(Preference.get("panelWidth")),
			parseInt(Preference.get("panelHeight")));
	});

	panel.port.on("graphType", function (value) {
		Preference.set('graphType', parseInt(value));
	});
};

exports.get = function () {
	return panel;
};
