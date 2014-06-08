'use strict';

// TODO Separar todo el codigo del servidor

var express = require('express'),
	path = require('path'),
	logger = require('morgan'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	mongoose = require('mongoose'),
	bcrypt = require('bcryptjs'),
	async = require('async'),
	xml2js = require('xml2js'),
	request = require('request'),
	session = require('express-session'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	agenda = require('agenda'),
	sugar = require('sugar'),
	nodemailer = require('nodemailer'),
	compress = require('compression');

var MONGO_URL = process.env.SHOWTRACKER_MONGO_URL || 'localhost:27017/showtracker',
	THE_TV_DB_API_KEY = process.env.THE_TV_DB_API_KEY;

var scheduler = agenda({
	db: {
		address: MONGO_URL
	}
});

/* --------- Models ----------*/
var showSchema = new mongoose.Schema({
	_id: Number,
	name: String,
	airsDayOfWeek: String,
	airsTime: String,
	firstAired: Date,
	genre: [String],
	network: String,
	overview: String,
	rating: Number,
	ratingCount: Number,
	status: String,
	poster: String,
	subscribers: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],
	episodes: [{
		season: Number,
		episodeNumber: Number,
		episodeName: String,
		firstAired: Date,
		overview: String
	}]
});

var userSchema = new mongoose.Schema({
	email: { type: String, unique: true},
	password: String
});
userSchema.pre('save', function(next) {
	var user = this;
	
	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.genSalt(10, function(err, salt) {
		if (err) return next(err);

		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) return next(err);

			user.password = hash;
			next();
		});
	});
});
userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) return cb(err);
		cb(null, isMatch);
	});
};

var User = mongoose.model('User', userSchema),
	Show = mongoose.model('Show', showSchema);

/* ----------------- Scheduler Configuration ------------------- */
scheduler.define('send email alert', function(job, done) {
	Show.findOne({ name: job.attrs.data }).populate('subscribers').exec(function(err, show) {
		var emails = show.subscribers.map(function(user) {
			return user.email;
		});

		var upcomingEpisode = show.episodes.filter(function(episode) {
			return new Date(episode.firstAired) > new Date();
		})[0];

		var smtpTransport = nodemailer.createTransport('SMTP', {
			service: 'SendGrid',
			auth: { user: 'hslogin', pass: 'hspassword00'}
		});

		var mailOptions = {
			from: 'Fred Foo - <foo@blurdyboop.com>',
			to: emails.join(','),
			subject: show.name + ' is starting soon!',
			text: show.name + ' starts in less than 2 hours on ' + show.network + '.\n\n' +
				'Episode ' + upcomingEpisode.episodeNumber + ': ' + upcomingEpisode.episodeName + '\n' +
				'Overview:\n\t' + upcomingEpisode.overview
		};

		// TODO Aqui todo el mundo va a ver los emails de los demas. O bien se envia
		// con copia oculta (mejor) o bien se envia un email a cada usuario.
		smtpTransport.sendMail(mailOptions, function(error, response) {
			console.log('Message sent:', response.message);
			smtpTransport.close();
			done();
		});
	});
});

scheduler.on('start', function(job) {
	console.log('Job %s stated...', job.attrs.name);
});

scheduler.on('complete', function(job) {
	console.log('Job %s finished.', job.attrs.name);
});

/* ----------- Express middleware ----------------- */
var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ secret: 'fjdsFDSF44···4jkffSDF' }));
app.use(passport.initialize());
app.use(passport.session());
// TODO El maxAge no parece estar funcionando
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 })); // One day caching

/* ------------- Custom Middlewares -------------- */
app.use(function(req, res, next) {
	if (req.user) {
		res.cookie('user', JSON.stringify(req.user));
	}
	next();
});
function _ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.send(401);
	}
}

/* ------------- Passport auth configuration -------------- */
passport.serializeUser(function(user, done) {
	done(null, user.id);
});
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});
passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
	User.findOne({ email: email }, function(err, user) {
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

/* --------------- Express routing ---------------- */
app.get('/api/shows', function(req, res, next) {
	var query = Show.find();
	
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
	Show.findById(req.params.id, function(err, show) {
		if (err) return next(err);
		res.json(show);
	});
});

app.post('/api/shows', function(req, res, next) {
	var parser = xml2js.Parser({
			explicitArray: false,
			normalizeTags: true
		}),
		seriesName = req.body.showName
			.toLowerCase()
			.replace(/ /g, '_')
			.replace(/[^\w-]+/g, ''); // The TVDB necesita este formato para las consultas

	async.waterfall([
		// 1.- Get the Show ID given the Show Name and pass it on to the next function.
		function(done) {
			request.get('http://thetvdb.com/api/GetSeries.php?seriesname='+ seriesName, function(error, response, body) {
				if (error) return done(error);
				parser.parseString(body, function(err, result) {
					if (err) return done(err);
					var seriesId = result.data.series.seriesid || result.data.series[0].seriesid;
					done(null, seriesId);
				});
			});
		},
		// 2.- Get the show information using the Show ID from the previous step and pass the new 'show' object to the next funcfnction
		function(showId, done) {
			request('http://thetvdb.com/api/' + THE_TV_DB_API_KEY + '/series/' + showId + '/all/en.xml', function(error, response, body) {
				if (error) return done(error);

				parser.parseString(body, function(err, result) {
					if (err) return done(err);
					var series = result.data.series,
						episodes = result.data.episode,
						show;

					show = new Show({
						_id: series.id,
						name: series.seriesname,
						airsDayOfWeek: series.airs_dayofweek,
						airsTime: series.airs_time,
						firstAired: series.firstaired,
						genre: series.genre.split('|').filter(Boolean),
						network: series.network,
						overview: series.overview,
						rating: series.rating,
						ratingCount: series.ratingcount,
						runtime: series.runtime,
						status: series.status,
						poster: series.poster,
						episodes: episodes.map(function(episode) {
							return {
								season: episode.seasonnumber,
								episodeNumber: episode.episodenumber,
								episodeName: episode.episodename,
								firstAired: episode.firstaired,
								overview: episode.overview,
								ratingValue: episode.rating,
								ratingCount: episode.ratingCount
							};
						})
					});

					done(null, show);
				});
			});
		},
		// 3.- Convert the poster image to Base64, assing to 'show.poster' and pass the 'show' object to the final callback function
		function(show, done) {
			var url = 'http://thetvdb.com/banners/' + show.poster;
			request({url: url, encoding: null}, function(error, response, body) {
				if (error) return done(error);
				show.poster = 'data:' + response.headers['content-type'] + ';base64,' + body.toString('base64');
				done(null, show);
			});
		}
	], 
	function(err, show) {
		if (err) return next(err);
		show.save(function(err) {
			if (err) {
				return next(err);
			} else {
				// res.json(show);
				console.log('TV Show saved:', show._id);
				// Schedule mail notifications (TODO Deberiamos avisar con mas antelacion)
				var alertDate = Date.create('Next ' + show.airsDayOfWeek + ' at ' +
					show.airsTime).rewind({ hour: 2}); // SugarJS syntax
				scheduler.schedule(alertDate, 'send email alert', show.name).repeatEvery('1 week');

				res.send(200);
			}
		});
	});
});

app.post('/api/subscribe', _ensureAuthenticated, function(req, res, next) {
	Show.findById(req.body.showId, function(err, show) {
		if (err) return next(err);
		show.subscribers.push(req.body.userId); // TODO Se debe coger de la sesion (de lo contrario me puede suscribir otro usuario sin que yo lo sepa)
		show.save(function(err) { // TODO No guardar si no estaba suscrito
			if (err) return next(err);
			res.send(200);
		});
	});
});
// TODO Refactorizar (ambas funciones se parecen demasiado)
app.post('/api/unsubscribe', _ensureAuthenticated, function(req, res, next) {
	Show.findById(req.body.showId, function(err, show) {
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
	var user = new User({
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

app.get('/api/logout', function(req, res, next) {
	req.logout();
	res.send(200);
});

app.get('*', function(req, res) {
	console.log('Redirecting to home page...');
	res.redirect('/#' + req.originalUrl);
});

app.use(function(err, req, res, next) {
	console.log(err);
	console.log(err.stack);
	res.status(500).json({ message: err.message });
});

/* ---------------- Application bootstrap --------------- */
console.log("Connecting to MongoDB:", MONGO_URL);
mongoose.connect(MONGO_URL, function() {
	app.listen(app.get('port'), function() {
		console.log('Express server listening on port ', app.get('port'));
	});
});
