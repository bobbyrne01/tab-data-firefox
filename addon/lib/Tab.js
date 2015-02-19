var tabs = require("sdk/tabs"),
	ss = require("./SimpleStorage"),
	sessionCount = 0,
	currentCount = 0;

exports.init = function () {

	if (typeof ss.getGlobalCount() === 'undefined') {
		ss.setGlobalCount(0);
	}

	for each(var tab in tabs) {

		ss.setGlobalCount(ss.getGlobalCount() + 1, new Date().getTime());
		sessionCount++;
		currentCount++;
	}


	// Listen for tab openings.
	tabs.on('open', function onOpen(tab) {

		ss.setGlobalCount(ss.getGlobalCount() + 1, new Date().getTime());
		sessionCount++;
		currentCount++;
		console.log('Global: ' + ss.getGlobalCount());
		console.log('Session: ' + sessionCount);
		console.log('Current: ' + currentCount);
	});

	//Listen for tab closes.
	tabs.on('close', function onOpen(tab) {

		currentCount--;
		console.log('Global: ' + ss.getGlobalCount());
		console.log('Session: ' + sessionCount);
		console.log('Current: ' + currentCount);
	});
};

exports.getGlobalCount = function () {
	return ss.getGlobalCount();
};

exports.getSessionCount = function () {
	return sessionCount;
};

exports.getCurrentCount = function () {
	return currentCount;
};
