var tabdata_helper = {

	emitValueOnChange: function (id) {

		document.getElementById(id).addEventListener("change", function (event) {
			self.port.emit(id, document.getElementById(id).value);
		}, false);
	},

	emitCheckedOnChange: function (id) {

		document.getElementById(id).addEventListener("change", function (event) {
			self.port.emit(id, document.getElementById(id).checked);
		}, false);
	},

	inputValueChanged: function (id, offset) {

		document.getElementById(id).onkeyup = function (event) {

			if (document.getElementById(id).value >= 1) {

				self.port.emit(id, document.getElementById(id).value);
				document.getElementById(id).className = 'green';

				if (offset !== 0) {
					document.getElementById("canvas").height = document.getElementById(id).value - offset;
				}

			} else {

				document.getElementById(id).className = 'red';
			}
		};
	}
};
