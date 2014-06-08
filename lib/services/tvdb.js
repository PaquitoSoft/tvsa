'use strict';

var async = require('async'),
	request = require('request'),
	xml2js = require('xml2js'),
	models = require('../models');

require('sugar');

var BASE_URL = 'http://thetvdb.com/api',
	SEARCH_URL = BASE_URL + '/GetSeries.php?seriesname={showName}',
	TVSHOW_DETAIL_URL = BASE_URL + '/{apiKey}/series/{showId}/all/{langCode}.xml';

var apiKey;

function _getTvShow(showName, done) {

	var parser = xml2js.Parser({
			explicitArray: false,
			normalizeTags: true
		}),
		seriesName = showName
			.toLowerCase()
			.replace(/ /g, '_')
			.replace(/[^\w-]+/g, ''); // TVDB needs this query format

	async.waterfall([
		// 1.- Get the Show ID given the Show Name and pass it on to the next function.
		function(done) {
			var url = SEARCH_URL.assign({showName: seriesName });

			request.get(url, function(error, response, body) {
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
			var url = TVSHOW_DETAIL_URL.assign({
				apiKey: apiKey,
				showId: showId,
				langCode: 'en'
			});

			request(url, function(error, response, body) {
				if (error) return done(error);

				parser.parseString(body, function(err, result) {
					if (err) return done(err);
					var series = result.data.series,
						episodes = result.data.episode,
						show;

					show = new models.Show({
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
		if (err) return done(err);

		// TODO Should not save tvshow here
		show.save(function(err) {
			if (err) {
				return done(err);
			} else {
				console.log('TV Show saved:', show._id);

				// Schedule mail notifications (TODO Deberiamos avisar con mas antelacion)
				// var alertDate = Date.create('Next ' + show.airsDayOfWeek + ' at ' +
				//	show.airsTime).rewind({ hour: 2}); // SugarJS syntax
				// scheduler.schedule(alertDate, 'send email alert', show.name).repeatEvery('1 week');

				done(show);
			}
		});
	});
}

module.exports.configure = function configureTvdb(config, done) {
	apiKey = config.apiKey;
	done();
};

module.exports.getTvdb = _getTvShow;
