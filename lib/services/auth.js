'use strict';

var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	models = require('../models');

module.exports.configure = function initAuth(done) {

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		models.User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
		models.User.findOne({ email: email }, function(err, user) {
			if (err) return done(err);
			if (!user) return done(null, false);
			user.comparePassword(password, function(err, isMatch) {
				if (err) return done(err);
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false);
				}
			});
		});
	}));

	done();	
};