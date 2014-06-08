'use strict';

var nodemailer = require('nodemailer');

var FROM = 'TVSA - <tvsa@gmail.com>';

var smtpTransport;

/*
	Sends the notification about a new tvshow episode about
	to be broadcasted.

	@param show {Show} -> Episode's show
	@param episode {Object} -> Episode to be broadcasted
	@param emails {Array} -> list of emails to be notified
	@param done {Function} -> callback when email has been sent (or error)
*/
function _sendUpcomingEpisodeNotification(show, episode, emails, done) {

	var mailOptions = {
		from: FROM,
		cc: emails,
		subject: show.name + ' is starting soon!',
		text: show.name + ' starts in less than 2 hours on ' + show.network + '.\n\n' +
			'Episode ' + episode.episodeNumber + ': ' + episode.episodeName + '\n' +
			'Overview:\n\t' + episode.overview
	};

	smtpTransport.sendMail(mailOptions, function(error, response) {
		console.log('Message sent:', response.message);
		smtpTransport.close();
		done(error);
	});
}

module.exports.configure = function initMailer(config, done) {
	smtpTransport = nodemailer.createTransport('SMTP', {
		service: 'SendGrid',
		auth: {
			user: config.user || 'hslogin',
			pass: config.password || 'hspassword00'
		}
	});
	done();
};

module.exports.sendUpcomingEpisodeNotification = _sendUpcomingEpisodeNotification;