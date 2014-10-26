self.port.on("stats", function (stats) {
	var parsedStats = JSON.parse(stats);
	
	document.getElementById("globalCount").value = parsedStats.globalCount;
	document.getElementById("sessionCount").value = parsedStats.sessionCount;
	document.getElementById("currentCount").value = parsedStats.currentCount;
});
