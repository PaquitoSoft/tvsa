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

	app.param('showId', function _loadShow(req, res, next, showId) {
		models.Show.findById(showId, function(err, show) {
			if (err) {
				next(err);
			} else {
				req.show = show;
				next();
			}
		});
	});

	app.get('/', function(req, res, next) {
		var query = models.Show.find();
		
		if (req.query.genre) {
			query.where({genre: req.query.genre}).limit(50);
		} else if (req.query.alphabet) {
			query.where({name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i') }).limit(50);
		} else {
			query.limit(12);
		}

		models.Show.count({genre: req.query.genre}, function(err, count) {
			console.log('TvSeries for genre %s: %d', req.query.genre, count);
		});

		query.exec(function(err, shows) {
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

	app.get('/show/:showId', function(req, res) {	
		var isUserLogged = !!req.user;
		
		res.render('pages/show-detail', {
			show: req.show,
			isUserSubscribed: isUserLogged && req.show.subscribers.indexOf(req.user._id) !== -1,
			isUserLogged: isUserLogged
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

	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/signin', function (req, res) {
		res.render('pages/signin');
	});

	app.post('/signin', function (req, res, next) {
		var user = new models.User({
			email: req.body.email,
			password: req.body.password
		});

		user.save(function(err) {
			if (err) {
				return next(err);
			} else {
				res.redirect('/');
			}
		});
	});

	app.post('/show/:showId/subscribe', function (req, res, next) {			
		var index = req.show.subscribers.indexOf(req.user._id),
			destinationUrl = req.get('Referer') || '/';

		if (index === -1) {
			req.show.subscribers.push(req.user._id);
			req.show.save(function(err) {
				if (err) return next(err);
				res.redirect(destinationUrl);
			});	
		} else {
			res.redirect(destinationUrl);
		}
	});

	app.post('/show/:showId/unsubscribe', function (req, res, next) {
		var index = req.show.subscribers.indexOf(req.user._id),
			destinationUrl = req.get('Referer') || '/';

		if (index !== -1) {
			req.show.subscribers.splice(index, 1);
			req.show.save(function(err) {
				if (err) return next(err);
				res.redirect(destinationUrl);
			});	
		} else {
			res.redirect(destinationUrl);
		}
	});

};
