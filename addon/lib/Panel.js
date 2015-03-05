var Panel = require("sdk/panel"),
	Tab = require("./Tab"),
	Data = require("./Data"),
	Button = require("./ToggleButton"),
	Preference = require("./Preference"),
	Chrome = require("./Chrome"),
	panel;

exports.init = function () {

	panel = Panel.Panel({
		width: 525,
		height: 475,
		contentURL: Data.get("html/view.html"),
		contentScriptFile: [Data.get("bower_components/Chart.js/Chart.js"), Data.get("js/controller.js")],
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
				memoryCautionColor: Preference.get("memoryCautionColor")
			});

			panel.port.emit("stats", stats);
		},
		onHide: function () {
			Button.get().state('window', {
				checked: false
			});
		}
	});

	panel.port.on("memoryTrackingSetting", function (value) {
		Preference.set('memoryTracking', value);

		if (!Preference.get('memoryTracking')) {
			Tab.removeScheduledFunction();
			Tab.rollbackTitles();
		}
	});

	panel.port.on("memoryIntervalSetting", function (value) {
		Preference.set('memoryInterval', value);
		Tab.removeScheduledFunction();
		Tab.reinitTimeout();
	});

	panel.port.on("memoryUsageOnTabTitlesSetting", function (value) {
		Preference.set('memoryUsageOnTabTitles', parseInt(value));
	});

	panel.port.on("memoryFormatSetting", function (value) {
		Preference.set('memoryFormat', parseInt(value));
		Tab.removeScheduledFunction();
		Tab.updateMemoryCounters();
	});

	panel.port.on("memoryUrlInUsageSetting", function (value) {
		Preference.set('memoryUrlInUsage', value);
		Tab.removeScheduledFunction();
		Tab.updateMemoryCounters();
	});

	panel.port.on("memoryCautionThresholdSetting", function (value) {
		Preference.set('memoryCautionThreshold', value);
	});

	panel.port.on("memoryCautionColorSetting", function (value) {
		Preference.set('memoryCautionColor', value);
	});

	panel.port.on("schedulePreciseGC", function (value) {
		Chrome.gc(panel);
	});

	panel.port.on("garbageCollect", function (value) {
		// TODO implement
	});
};

exports.get = function () {
	return panel;
};
