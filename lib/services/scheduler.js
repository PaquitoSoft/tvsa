'use strict';

var Agenda = require('agenda'),
	mailer = require('./mailer'),
	models = require('../models');


/* --------- Define tasks --------- */
function _defineTasks(scheduler) {
	scheduler.define('send episode about to be broadcasted notification', function(job, done) {
		models.Show.findOne({ name: job.attrs.data }).populate('subscribers').exec(function(err, show) {
			var emails = show.subscribers.map(function(user) {
				return user.email;
			});

			var upcomingEpisode = show.episodes.filter(function(episode) {
				return new Date(episode.firstAired) > new Date();
			})[0];

			mailer.sendUpcomingEpisodeNotification(show, upcomingEpisode, emails.join(','), function(mError) {
				if (mError) {
					console.warn('Scheduler::SendEmailAlert# Problem sending episode about to be broadcasted notification:', mError);
				}
				done();
			});
		});
	});
}



/* ------------ Public API ------------- */

module.exports.init = function initScheduler(config, done) {
	var scheduler = new Agenda({
		db: {
			address: config.mongoUrl,
			collection: config.collectionName || 'scheduler'
		}
	});

	scheduler.on('start', function(job) {
		console.log('Job %s stated...', job.attrs.name);
	});

	scheduler.on('complete', function(job) {
		console.log('Job %s finished.', job.attrs.name);
	});

	_defineTasks(scheduler);

	done();
};
