var preference = require("sdk/simple-prefs");

exports.get = function (name) {
	return preference.prefs[name];
};
exports.set = function (name, value) {
	preference.prefs[name] = value;
};
