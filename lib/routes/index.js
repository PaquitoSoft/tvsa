'use strict';

var navigationRoutes = require('./navigation-routes'),
	showRoutes = require('./show-routes'),
	userRoutes = require('./user-routes'),
	errorRoutes = require('./error-routes');

function configure(app) {
	navigationRoutes.configure(app);
	showRoutes.configure(app);
	userRoutes.configure(app);
	errorRoutes.configure(app);
}

module.exports = {
	navigationRouting: navigationRoutes,
	showRouting: showRoutes,
	userRouting: userRoutes,
	errorRouting: errorRoutes,
	configure: configure
};
