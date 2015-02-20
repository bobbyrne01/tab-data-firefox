/*
 * Event listeners
 */
document.getElementById('memoryTrackingPref').addEventListener("change", function (event) {
	
	if (document.getElementById('memoryTrackingPref').checked) {
		
		self.port.emit("memoryTrackingSetting", true);
		document.getElementById('memoryIntervalPref').disabled = false;
		
	} else {
		
		self.port.emit("memoryTrackingSetting", false);
		document.getElementById('memoryIntervalPref').disabled = true;
	}
}, false);

document.getElementById('memoryIntervalPref').onkeyup = function (event) {
	
	if (document.getElementById('memoryIntervalPref').value >= 1){
		
		self.port.emit("memoryIntervalSetting", document.getElementById('memoryIntervalPref').value);
		document.getElementById('memoryIntervalPref').className = 'green';
		
	}else{
		
		document.getElementById('memoryIntervalPref').className = 'red';
	}
};



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
});