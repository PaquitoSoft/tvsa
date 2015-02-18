'use strict';

var models = require('../models');

module.exports.configure = function(app) {


	// These should live in a Mongo Collection
	var alphabet = ['0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
		'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
		'Y', 'Z'];

	var genres = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy',
		'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Food',
		'Home and Garden', 'Horror', 'Mini-Series', 'Mystery', 'News', 'Reality',
		'Romance', 'Sci-Fi', 'Sport', 'Suspense', 'Talk Show', 'Thriller',
		'Travel'];

	app.get('/', function(req, res, next) {
		models.Show.find().limit(12).exec(function(err, shows) {
			if (err) return next(err);

			res.render('pages/home', {
				shows: shows,
				alphabet: alphabet,
				genres: genres,
				headingTitle: 'Top 12 Super Shows'
			});
		});
	});

	/*app.get('/show/:id', function(req, res, next) {
		models.Show.findById(req.params.id, function(err, show) {
			if (err) return next(err);
			res.json(show);
		});
	});*/

	/*app.post('/api/shows', function(req, res, next) {
		tvdb.getTvdb(req.body.showName, function(err, show) {
			if (err) return next(err);
			res.send(200);
		});
	});*/

};