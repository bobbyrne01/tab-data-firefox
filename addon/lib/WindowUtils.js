var window_utils = require('sdk/window/utils');

exports.getWindows = function () {
	return window_utils.windows(null, {
		includePrivate: true
	});
};
