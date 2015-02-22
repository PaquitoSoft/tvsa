'use strict';

var moment = require('moment');

var DEFAULT_FORMAT = 'YYYY/MM/DD';

module.exports = {
	formatTime: function(timeString, format) {
		return (timeString) ? moment(timeString).format(format || DEFAULT_FORMAT) : '';
	}
};
