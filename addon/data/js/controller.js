/*
 * Event listeners
 */
document.getElementById('memoryTrackingPref').addEventListener("change", function (event) {

	if (document.getElementById('memoryTrackingPref').checked) {

		self.port.emit("memoryTrackingSetting", true);
		document.getElementById('memoryIntervalPref').disabled = false;
		document.getElementById('memoryUsageOnTabTitlesPref').disabled = false;

	} else {

		self.port.emit("memoryTrackingSetting", false);
		document.getElementById('memoryIntervalPref').disabled = true;
		document.getElementById('memoryUsageOnTabTitlesPref').disabled = true;
	}
}, false);

document.getElementById('memoryIntervalPref').onkeyup = function (event) {

	if (document.getElementById('memoryIntervalPref').value >= 1) {

		self.port.emit("memoryIntervalSetting", document.getElementById('memoryIntervalPref').value);
		document.getElementById('memoryIntervalPref').className = 'green';

	} else {

		document.getElementById('memoryIntervalPref').className = 'red';
	}
};

document.getElementById('memoryUsageOnTabTitlesPref').addEventListener("change", function (event) {

	if (document.getElementById('memoryUsageOnTabTitlesPref').checked) {

		self.port.emit("memoryUsageOnTabTitlesSetting", true);

	} else {

		self.port.emit("memoryUsageOnTabTitlesSetting", false);
	}
}, false);



/*
 * Listen for add-on messages
 */
self.port.on("stats", function (stats) {
	var parsedStats = JSON.parse(stats);

	document.getElementById("globalCount").value = parsedStats.globalCount;
	document.getElementById("sessionCount").value = parsedStats.sessionCount;
	document.getElementById("currentCount").value = parsedStats.currentCount;
	document.getElementById("memoryTrackingPref").checked = parsedStats.memoryTracking;
	document.getElementById("memoryIntervalPref").value = parsedStats.memoryInterval;
	document.getElementById("memoryUsageOnTabTitlesPref").checked = parsedStats.memoryUsageOnTabTitles;
});

self.port.on("memoryDump", function (value) {
	
	var dump = JSON.parse(value);
	document.getElementById("memoryDump").textContent = '';
	
	for (var i = 0; i < dump.length; i++){
		document.getElementById("memoryDump").appendChild(document.createTextNode(dump[i].memory + ': ' + dump[i].tabTitle));
		document.getElementById("memoryDump").appendChild(document.createElement('br'));
	}
});
