'use strict';

var passport = require('passport'),
	models = require('../models');

module.exports.configure = function(app) {

	// TODO Middleware to load user data into server-side rendered views

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

			console.log('User logged:', !!req.user);
			
			res.render('pages/home', {
				shows: shows,
				alphabet: alphabet,
				genres: genres,
				headingTitle: 'Top 12 Super Shows',
				isUserLogged: !!req.user
			});
		});
	});

	app.get('/show/:id', function(req, res, next) {
		models.Show.findById(req.params.id, function(err, show) {
			if (err) return next(err);

			var isUserLogged = !!req.user;
			
			res.render('pages/show-detail', {
				show: show,
				isUserSubscribed: isUserLogged && show.subscribers.indexOf(req.user._id) !== -1,
				isUserLogged: isUserLogged
			});

		});
	});

	app.get('/login', function (req, res) {
		res.render('pages/login');
	});
	
	app.post('/login', passport.authenticate('local'), function(req, res) {
		var user = {
			id: req.user._id,
			email: req.user.email
		};
		res.cookie('user', user);
		res.redirect('/');
	});

	app.get('/signin', function (req, res) {
		res.render('pages/signin');
	});

	

};
