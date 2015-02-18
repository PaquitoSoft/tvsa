'use strict';

// These routes must be configured the last
module.exports.configure = function(app) {
	// Page not found routing
	app.get('*', function(req, res) {
		console.log('404: Redirecting to home page...');
		res.redirect('/#' + req.originalUrl);
	});

	// Basic error handler
	app.use(function(err, req, res/*, next*/) {
		console.log(err);
		console.log(err.stack);
		res.status(500).json({ message: err.message });
	});
};