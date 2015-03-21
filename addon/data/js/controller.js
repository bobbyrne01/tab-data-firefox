var data = {
	labels: [],
	datasets: []
};


/*
 * Event listeners
 */
document.getElementById('memoryTrackingPref').addEventListener("change", function (event) {

	if (document.getElementById('memoryTrackingPref').checked) {

		self.port.emit("memoryTrackingSetting", true);
		document.getElementById('memoryIntervalPref').disabled = false;
		document.getElementById('memoryUsageOnTabTitlesPref').disabled = false;
		document.getElementById('memoryUrlInUsage').disabled = false;

	} else {

		self.port.emit("memoryTrackingSetting", false);
		document.getElementById('memoryIntervalPref').disabled = true;
		document.getElementById('memoryUsageOnTabTitlesPref').disabled = true;
		document.getElementById('memoryUrlInUsage').disabled = true;

		document.getElementById("memoryDump").textContent = '';
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

document.getElementById('memoryFormat').addEventListener("change", function (event) {

	self.port.emit("memoryFormatSetting", document.getElementById('memoryFormat').value);
}, false);

document.getElementById('memoryUsageOnTabTitlesPref').addEventListener("change", function (event) {

	self.port.emit("memoryUsageOnTabTitlesSetting", document.getElementById('memoryUsageOnTabTitlesPref').value);
}, false);

document.getElementById('memoryUrlInUsage').addEventListener("change", function (event) {

	self.port.emit("memoryUrlInUsageSetting", document.getElementById('memoryUrlInUsage').checked);
}, false);

document.getElementById('schedulePreciseGC').addEventListener("click", function (event) {
	document.getElementById('schedulePreciseGC').disabled = true;
	self.port.emit("schedulePreciseGC", '');
}, false);

document.getElementById('panelWidth').onkeyup = function (event) {

	if (document.getElementById('panelWidth').value >= 1) {

		self.port.emit("panelWidth", document.getElementById('panelWidth').value);
		document.getElementById('panelWidth').className = 'green';
		document.getElementById("canvas").width = document.getElementById('panelWidth').value - 45;

	} else {

		document.getElementById('panelWidth').className = 'red';
	}
};

document.getElementById('panelHeight').onkeyup = function (event) {

	if (document.getElementById('panelHeight').value >= 1) {

		self.port.emit("panelHeight", document.getElementById('panelHeight').value);
		document.getElementById('panelHeight').className = 'green';
		document.getElementById("canvas").height = document.getElementById('panelHeight').value - 185;

	} else {

		document.getElementById('panelHeight').className = 'red';
	}
};

document.getElementById('graphType').addEventListener("change", function (event) {

	self.port.emit("graphTypeSetting", document.getElementById('graphType').value);
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
	document.getElementById("memoryUsageOnTabTitlesPref").value = parsedStats.memoryUsageOnTabTitles;
	document.getElementById("memoryFormat").value = parsedStats.memoryFormat;
	document.getElementById("memoryUrlInUsage").checked = parsedStats.memoryUrlInUsage;
	document.getElementById("panelWidth").value = parsedStats.panelWidth;
	document.getElementById("panelHeight").value = parsedStats.panelHeight;
	document.getElementById("graphType").value = parsedStats.graphType;

	document.getElementById("canvas").width = parsedStats.panelWidth - 45;
	document.getElementById("canvas").height = parsedStats.panelHeight - 185;
});

self.port.on("memoryDump", function (value) {

	var dump = JSON.parse(value).memoryDump;
	var graphData = JSON.parse(value).graphData;
	document.getElementById("memoryDump").textContent = '';

	updateCanvas(JSON.parse(graphData));

	if (parseInt(document.getElementById('memoryFormat').value) === 0) { // JSON

		var pre = document.createElement('pre');

		if (!document.getElementById("memoryUrlInUsage").checked) { // remove Url from each object

			for (var i = 0; i < dump.length; i++) {
				delete dump[i].Url;
			}
		}

		try {

			document.getElementById("memoryDump").appendChild(pre);

			var highlightedJson = syntaxHighlight(JSON.stringify(dump, undefined, 4)),
				range = document.createRange();

			range.selectNode(pre);
			var docFrag = range.createContextualFragment(highlightedJson);

			pre.appendChild(docFrag);

		} catch (e) {
			pre.appendChild(document.createTextNode('Error'));
			document.getElementById("memoryDump").appendChild(pre);
		}

	} else { // Plain

		for (var j = 0; j < dump.length; j++) {

			var string = dump[j].Memory + ': ' + dump[j].Title;

			if (document.getElementById("memoryUrlInUsage").checked) {
				string += ': ' + dump[j].Url;
			}

			document.getElementById("memoryDump").appendChild(document.createTextNode(string));
			document.getElementById("memoryDump").appendChild(document.createElement('br'));
		}
	}
});

self.port.on("schedulePreciseGC", function (value) {
	document.getElementById('schedulePreciseGCStatus').style.display = 'inline';
	document.getElementById('schedulePreciseGC').disabled = false;
	setTimeout(function () {
		document.getElementById('schedulePreciseGCStatus').style.display = 'none';
	}, 5000);
});


//Taken from: http://stackoverflow.com/a/7220510
function syntaxHighlight(json) {

	var jsonElements;

	json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {

		var cls = 'number';
		if (/^"/.test(match)) {
			if (/:$/.test(match)) {
				cls = 'key';
			} else {
				cls = 'string';
			}
		} else if (/true|false/.test(match)) {
			cls = 'boolean';
		} else if (/null/.test(match)) {
			cls = 'null';
		}
		return '<span class="' + cls + '">' + match + '</span>';
	});
}

function updateCanvas(graphData) {

	var options = {
		animation: false,
		showTooltips: false,
		responsive: false,
		pointDot: false
	};

	// determine graph type
	if (parseInt(document.getElementById("graphType").value) === 0) {

		myNewChart = new Chart(document.getElementById("canvas").getContext("2d")).Line(graphData, options);

	} else if (parseInt(document.getElementById("graphType").value) === 1) {

		myNewChart = new Chart(document.getElementById("canvas").getContext("2d")).Bar(graphData, options);

	} else if (parseInt(document.getElementById("graphType").value) === 2) {

		myNewChart = new Chart(document.getElementById("canvas").getContext("2d")).Radar(graphData, options);

	} else if (parseInt(document.getElementById("graphType").value) === 3) {

		var data = [];

		// reformat data for Polar area chart
		for (var i = 0; i < graphData.datasets.length; i++) {
			data.push({
				value: graphData.datasets[i].data[graphData.datasets[i].data.length - 1],
				color: graphData.datasets[i].strokeColor,
				highlight: graphData.datasets[i].fillColor,
				label: graphData.datasets[i].label
			});
		}

		myNewChart = new Chart(document.getElementById("canvas").getContext("2d")).PolarArea(data, options);
	}

	// clear previous legend
	document.getElementById('legend').textContent = '';

	// create legend
	var ul = document.createElement('ul');

	for (var j = 0; j < graphData.datasets.length; j++) {

		var li = document.createElement('li'),
			label = document.createElement('label');

		ul.appendChild(li);

		label.appendChild(document.createTextNode(graphData.datasets[j].data[4] + ': ' + graphData.datasets[j].label));
		label.className = 'boldText';
		label.style.color = graphData.datasets[j].strokeColor;
		li.appendChild(label);
	}

	document.getElementById('legend').appendChild(ul);
}
