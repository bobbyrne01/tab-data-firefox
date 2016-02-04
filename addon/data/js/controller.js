var data = {
	labels: [],
	datasets: []
};


/*
 * Event listeners
 */
document.getElementById('memoryTracking').addEventListener("change", function (event) {

	if (document.getElementById('memoryTracking').checked) {

		self.port.emit("memoryTracking", true);
		document.getElementById('memoryInterval').disabled = false;
		document.getElementById('memoryUsageOnTabTitles').disabled = false;
		document.getElementById('memoryFormat').disabled = false;
		document.getElementById('memoryUrlInUsage').disabled = false;
		document.getElementById('memoryCautionThreshold').disabled = false;
		document.getElementById('graphType').disabled = false;

	} else {

		self.port.emit("memoryTracking", false);
		document.getElementById('memoryInterval').disabled = true;
		document.getElementById('memoryUsageOnTabTitles').disabled = true;
		document.getElementById('memoryFormat').disabled = true;
		document.getElementById('memoryUrlInUsage').disabled = true;
		document.getElementById('memoryCautionThreshold').disabled = true;
		document.getElementById('graphType').disabled = true;

		document.getElementById("memoryDump").textContent = '';
	}
}, false);

document.getElementById('schedulePreciseGC').addEventListener("click", function (event) {
	document.getElementById('schedulePreciseGC').disabled = true;
	self.port.emit("schedulePreciseGC", '');
}, false);

document.getElementById('memoryCautionThreshold').onkeyup = function (event) {
	if (parseInt(document.getElementById('memoryCautionThreshold').value) >= 0) {
		self.port.emit("memoryCautionThreshold", document.getElementById('memoryCautionThreshold').value);
		document.getElementById('memoryCautionThreshold').className = 'green';
	} else {
		document.getElementById('memoryCautionThreshold').className = 'red';
	}
};

tabdata_helper.inputValueChanged('panelHeight', 185);
tabdata_helper.inputValueChanged('panelWidth', 45);
tabdata_helper.inputValueChanged('memoryInterval', 0);
tabdata_helper.emitCheckedOnChange('memoryUrlInUsage');
tabdata_helper.emitValueOnChange('memoryFormat');
tabdata_helper.emitValueOnChange('memoryUsageOnTabTitles');
tabdata_helper.emitValueOnChange('graphType');



/*
 * Listen for add-on messages
 */
self.port.on("stats", function (stats) {
	var parsedStats = JSON.parse(stats);

	document.getElementById("globalCount").value = parsedStats.globalCount;
	document.getElementById("sessionCount").value = parsedStats.sessionCount;
	document.getElementById("currentCount").value = parsedStats.currentCount;
	document.getElementById("memoryTracking").checked = parsedStats.memoryTracking;
	document.getElementById("memoryInterval").value = parsedStats.memoryInterval;
	document.getElementById("memoryUsageOnTabTitles").value = parsedStats.memoryUsageOnTabTitles;
	document.getElementById("memoryFormat").value = parsedStats.memoryFormat;
	document.getElementById("memoryUrlInUsage").checked = parsedStats.memoryUrlInUsage;
	document.getElementById("memoryCautionThreshold").value = parsedStats.memoryCautionThreshold;
	document.getElementById("panelWidth").value = parsedStats.panelWidth;
	document.getElementById("panelHeight").value = parsedStats.panelHeight;
	document.getElementById("graphType").value = parsedStats.graphType;
	document.getElementById("canvas").width = parsedStats.panelWidth - 45;
	document.getElementById("canvas").height = parsedStats.panelHeight - 185;
});

self.port.on("memoryDump", function (value) {

	var dumps = JSON.parse(value).memoryDump;
	var graphData = JSON.parse(value).graphData;
	document.getElementById("memoryDump").textContent = '';

	updateCanvas(JSON.parse(graphData));

	if (parseInt(document.getElementById('memoryFormat').value) === 0) { // JSON

		var pre = document.createElement('pre');

		if (!document.getElementById("memoryUrlInUsage").checked) { // remove Url from each object

			for (var i = 0; i < dumps.length; i++) {
				delete dumps[i].Url;
			}
		}

		try {

			document.getElementById("memoryDump").appendChild(pre);

			var highlightedJson = syntaxHighlight(JSON.stringify(dumps, undefined, 4)),
				range = document.createRange();

			range.selectNode(pre);
			var docFrag = range.createContextualFragment(highlightedJson);
			pre.appendChild(docFrag);

		} catch (e) {
			pre.appendChild(document.createTextNode('Error'));
			document.getElementById("memoryDump").appendChild(pre);
		}

	} else { // Plain

		for (var b = 0; b < dumps.length; b++) {

			var string = dumps[b].Memory + ': ' + dumps[b].Title;

			if (document.getElementById("memoryUrlInUsage").checked) {
				string += ': ' + dumps[b].Url;
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
	return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
		function (match) {

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
		for (var n = 0; n < graphData.datasets.length; n++) {
			data.push({
				value: graphData.datasets[n].data[graphData.datasets[n].data.length - 1],
				color: graphData.datasets[n].strokeColor,
				highlight: graphData.datasets[n].fillColor,
				label: graphData.datasets[n].label
			});
		}

		myNewChart = new Chart(document.getElementById("canvas").getContext("2d")).PolarArea(data, options);
	
	}else{
		myNewChart.destroy();
	}

	// draw legend
	document.getElementById('legend').textContent = '';
	var ul = document.createElement('ul');

	for (var m = 0; m < graphData.datasets.length; m++) {

		var li = document.createElement('li'),
			label = document.createElement('label');

		ul.appendChild(li);

		label.appendChild(document.createTextNode(graphData.datasets[m].data[4] + ': ' + graphData.datasets[m].label));
		label.className = 'boldText';
		label.style.color = graphData.datasets[m].strokeColor;
		li.appendChild(label);
	}

	document.getElementById('legend').appendChild(ul);
}
