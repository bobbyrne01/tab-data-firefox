var Panel = require("sdk/panel"),
	Tab = require("./Tab"),
	Data = require("./Data"),
	Button = require("./ToggleButton"),
	Preference = require("./Preference"),
	panel;
const {
	Ci, Cc, Cu
} = require("chrome");

exports.init = function () {

	panel = Panel.Panel({
		width: 500,
		height: 350,
		contentURL: Data.get("html/view.html"),
		contentScriptFile: Data.get("js/controller.js"),
		onShow: function () {

			var stats = JSON.stringify({
				globalCount: Tab.getGlobalCount(),
				sessionCount: Tab.getSessionCount(),
				currentCount: Tab.getCurrentCount(),
				memoryTracking: Preference.get("memoryTracking"),
				memoryInterval: Preference.get("memoryInterval"),
				memoryUsageOnTabTitles: Preference.get("memoryUsageOnTabTitles"),
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
		Preference.set('memoryUsageOnTabTitles', value);

		if (!Preference.get('memoryUsageOnTabTitles')) {
			Tab.rollbackTitles();
		}
	});

	panel.port.on("memoryCautionThresholdSetting", function (value) {
		Preference.set('memoryCautionThreshold', value);
	});

	panel.port.on("memoryCautionColorSetting", function (value) {
		Preference.set('memoryCautionColor', value);
	});

	panel.port.on("schedulePreciseGC", function (value) {
		Cu.schedulePreciseGC(
			function () {
				panel.port.emit('schedulePreciseGC', 'done');
			}
		);
	});

	panel.port.on("garbageCollect", function (value) {
		// TODO implement
	});
};

exports.get = function () {
	return panel;
};
