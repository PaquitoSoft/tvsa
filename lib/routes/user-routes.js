'use strict';

var passport = require('passport'),
	models = require('../models'),
	middleware = require('../middleware');

module.exports.configure = function configureUserRoutes(app) {

	app.post('/api/subscribe', middleware.authChecker, function(req, res, next) {
		models.Show.findById(req.body.showId, function(err, show) {
			if (err) return next(err);

			var index = show.subscribers.indexOf(req.user._id);
			if (index === -1) {
				show.subscribers.push(req.user._id);
				show.save(function(err) {
					if (err) return next(err);
					res.json(show);
				});
			} else {
				res.send(202);
			}
			
		});
	});
	
	// This should be a DELETE on /api/subscribe
	app.post('/api/unsubscribe', middleware.authChecker, function(req, res, next) {
		models.Show.findById(req.body.showId, function(err, show) {
			if (err) return next(err);

			var index = show.subscribers.indexOf(req.user._id);
			if (index !== -1) {
				show.subscribers.splice(index, 1);
				show.save(function(err) {
					if (err) return next(err);
					res.send(200);
				});	
			} else {
				res.send(202);
			}
			
		});
	});

	// This should be a PORT on /api/session
	app.post('/api/login', passport.authenticate('local'), function(req, res) {
		var user = {
			id: req.user._id,
			email: req.user.email
		};
		res.cookie('user', JSON.stringify(user)); // TODO Por qué el json?
		res.json(user);
	});

	// This should be a POST on /api/user
	app.post('/api/signup', function(req, res, next) {
		var user = new models.User({
			email: req.body.email,
			password: req.body.password
		});
		user.save(function(err) {
			if (err) {
				return next(err);
			} else {
				res.send(200);
			}
		});
	});

	// This should be a DELETE on /api/session
	app.get('/api/logout', function(req, res/*, next*/) {
		req.logout();
		res.send(200);
	});

};
