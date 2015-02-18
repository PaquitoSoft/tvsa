'use strict';

var models = require('../models')/*,
	tvdb = require('../services/tvdb')*/;

module.exports.configure = function(app) {

	app.get('/api/shows', function(req, res, next) {
		var query = models.Show.find();
		
		if (req.query.genre) {
			query.where({genre: req.query.genre});
		} else if (req.query.alphabet) {
			query.where({name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i') });
		} else {
			query.limit(12);
		}

		query.exec(function(err, shows) {
			if (err) return next(err);
			res.json(shows);
		});
	});

	app.get('/api/shows/:id', function(req, res, next) {
		models.Show.findById(req.params.id, function(err, show) {
			if (err) return next(err);
			res.json(show);
		});
	});

	/*app.post('/api/shows', function(req, res, next) {
		tvdb.getTvdb(req.body.showName, function(err, show) {
			if (err) return next(err);
			res.send(200);
		});
	});*/

};