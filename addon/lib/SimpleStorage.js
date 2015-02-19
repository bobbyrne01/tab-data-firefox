var ss = require("sdk/simple-storage");

exports.init = function () {
	ss.storage.globalCount = [];
};

function getGlobalCount() {
	return ss.storage.globalCount;
}

exports.getGlobalCount = function () {
	return getGlobalCount();
};

function setGlobalCount(globalCount) {
	ss.storage.globalCount = globalCount;
}

exports.setGlobalCount = function (globalCount) {
	setGlobalCount(globalCount);
};
