var Panel = require("sdk/panel"),
	Tab = require("./Tab"),
	Data = require("./Data"),
	Button = require("./ToggleButton"),
	Preference = require("./Preference"),
	panel;

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
				memoryUsageOnTabTitles: Preference.get("memoryUsageOnTabTitles")
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
	});

	panel.port.on("memoryIntervalSetting", function (value) {
		Preference.set('memoryInterval', value);
	});

	panel.port.on("memoryUsageOnTabTitlesSetting", function (value) {
		Preference.set('memoryUsageOnTabTitles', value);
	});
};

exports.get = function () {

	return panel;
};
