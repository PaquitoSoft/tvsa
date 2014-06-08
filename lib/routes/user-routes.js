'use strict';

var passport = require('passport'),
	models = require('../models'),
	middleware = require('../middleware');

module.exports.configure = function configureUserRoutes(app) {

	app.post('/api/subscribe', middleware.authChecker, function(req, res, next) {
		models.Show.findById(req.body.showId, function(err, show) {
			if (err) return next(err);
			show.subscribers.push(req.body.userId); // TODO Se debe coger de la sesion (de lo contrario me puede suscribir otro usuario sin que yo lo sepa)
			show.save(function(err) { // TODO No guardar si no estaba suscrito
				if (err) return next(err);
				res.send(200);
			});
		});
	});
	// TODO Refactorizar (ambas funciones se parecen demasiado)
	app.post('/api/unsubscribe', middleware.authChecker, function(req, res, next) {
		models.Show.findById(req.body.showId, function(err, show) {
			if (err) return next(err);
			var index = show.subscribers.indexOf(req.body.userId);
			show.subscribers.splice(index, 1);
			show.save(function(err) { // TODO No guardar si no estaba suscrito
				if (err) return next(err);
				res.send(200);
			});
		});
	});

	app.post('/api/login', passport.authenticate('local'), function(req, res) {
		res.cookie('user', JSON.stringify(req.user)); // TODO No deberia ir el hash del password
		res.json(req.user); // TODO No deberia ir el hash del password
	});

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

	app.get('/api/logout', function(req, res/*, next*/) {
		req.logout();
		res.send(200);
	});

};
