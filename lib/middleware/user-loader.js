'use strict';

module.exports = function(req, res, next) {
	if (req.user) {
		res.locals.user = {
			email: req.user.email
		};
	}
	next();
};