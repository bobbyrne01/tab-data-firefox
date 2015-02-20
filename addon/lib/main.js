require("./Preference").registerListener();
require("./Tab").init();
require("./ToggleButton").init();
require("./Panel").init();

exports.onUnload = function (reason) {
	if (reason === 'uninstall' || reason === 'disable') {
		require("./Preference").removeListener();
	}
};
