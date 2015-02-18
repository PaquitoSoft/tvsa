'use strict';

var express = require('express'),
	path = require('path'),
	logger = require('morgan'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	async = require('async'),
	session = require('express-session'),
	passport = require('passport'),
	compress = require('compression'),
	mongoose = require('mongoose'),
	routing = require('./lib/routes'),
	scheduler = require('./lib/services/scheduler'),
	auth = require('./lib/services/auth'),
	// mailer = require('./lib/services/mailer'),
	// tvdb = require('./lib/services/tvdb'),
	renderer = require('./lib/services/renderer'),
	middleware = require('./lib/middleware');

var MONGO_URL = process.env.SHOWTRACKER_MONGO_URL || 'localhost:27017/showtracker'/*,
	THE_TV_DB_API_KEY = process.env.THE_TV_DB_API_KEY,
	SENDGRID_USER = process.env.SHOWTRACKER_SENDGRID_USER,
	SENDGRID_PASS = process.env.SHOWTRACKER_SENDGRID_PASS*/;


/* ----------- Express middleware ----------------- */
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', renderer);

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ secret: 'fjdsFDSF44···4jkffSDF' }));
app.use(passport.initialize());
app.use(passport.session());

app.use(middleware.imageProcessor);

// TODO El maxAge no parece estar funcionando
// app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 })); // One day caching
app.use(express.static(path.join(__dirname, 'public'))); // One day caching

/* ------------- Custom Middleware -------------- 
app.use(function(req, res, next) {
	// TODO Isn't password suppose to do this?
	if (req.user) {
		res.cookie('user', JSON.stringify(req.user));
	}
	next();
});
*/

/* ---------- Init and configure serices ----------- */
async.waterfall([
	function mongooseInit(done) {
		mongoose.connect(MONGO_URL, done);
	},
	function schedulerInit(done) {
		scheduler.init({
			mongoUrl: MONGO_URL,
			collection: 'scheduler'
		}, done);
	},
	function authConfig(done) {
		auth.configure(done);
	},
	/*function mailerConfig(done) {
		mailer.configure({
			user: SENDGRID_USER,
			password: SENDGRID_PASS
		}, done);
	},*/
	/*function tvdbConfig(done) {
		tvdb.configure({
			apiKey: THE_TV_DB_API_KEY
		}, done);
	},*/
	function routingConfig(done) {
		routing.configure(app);
		done();
	}
], function(err) {
	if (err) {
		console.log("Could not start application:", err);
	} else {
		app.listen(app.get('port'), function() {
			console.log('Express server listening on port ', app.get('port'));
		});
	}
});
