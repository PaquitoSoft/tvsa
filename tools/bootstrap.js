'use strict';

var async = require('async'),
	request = require('request'),
	cheerio = require('cheerio'),
	mongoose = require('mongoose'),
	TVDBClient = require('node-tvdb'),
	models = require('../lib/models');

var MONGODB_URL = "localhost/showtracker",
	TV_SHOWS_IDS_URL = "http://www.imdb.com/search/title?start={offset}&num_votes=5000," +
		"&sort=user_rating&title_type=tv_series&count={count}";


var offset = 1,
	count = 100,
	importedCount = 0,
	tvdbClient = new TVDBClient(process.env.THE_TV_DB_API_KEY);


function getTvShowsIds(offset, count, done) {
	console.log("Let's get a bunch of tv shows identifiers");
	var url = TV_SHOWS_IDS_URL
		.replace('{offset}', offset)
		.replace('{count}', count);

	request(url, function(err, response, body) {
		if (err) return done(err);

		var $ = cheerio.load(body),
			$links = $('.results tr .image a'),
			ids = [];

		$links.each(function(index, link) {
			var href = $(link).attr('href');
			if (href) {
				href = href.split('/');
				if (href && href.length > 2) {
					ids.push(href[2]);
				}
			}
		});

		done(null, ids);
	});

	// done(null, ['tt0903747']);
}

	
function checkTvShowProcessed(externalId, done) {
	console.log('Checking tvshow existance:', externalId);
	models.Show.findOne({ externalId: externalId }).exec(function(err, tvShow) {
		done(err, (tvShow && tvShow.externalId === externalId) );
	});
}

function getTvShowSummary(externalId, done) {
	console.log('Getting summary information for tvshow:', externalId);
	tvdbClient.getSeriesByRemoteId(externalId, function(err, data) {
		done(err, data);
	});
}

function getTvShowData(tvShowSummary, done) {
	console.log('Getting detailed information for tvShow:', tvShowSummary.SeriesName);
	
	tvdbClient.getSeriesAllById(tvShowSummary.seriesid, function(err, data) {
		var show;
		if (err) return done(err);

		show = new models.Show({
			_id: data.id,
			externalId: data.IMDB_ID,
			name: data.SeriesName,
			airsDayOfWeek: data.Airs_DayOfWeek,
			airsTime: data.Airs_Time,
			firstAired: data.FirstAired,
			genre: data.Genre.split('|').filter(Boolean),
			network: data.Network,
			overview: data.Overview,
			rating: data.rating,
			ratingCount: data.RatingCount,
			runtime: data.Runtime,
			status: data.Status,
			poster: data.poster,
			episodes: data.Episodes.map(function(episode) {
				return {
					season: episode.SeasonNumber,
					episodeNumber: episode.EpisodeNumber,
					episodeName: episode.EpisodeName,
					firstAired: episode.FirstAired,
					overview: episode.Overview,
					ratingValue: episode.Rating,
					ratingCount: episode.RatingCount,
					poster: episode.filename
				};
			})
		});

		done(null, show);
	});

}

function saveTvShow(tvShow, done) {
	tvShow.save(function(err) {
		done(err, tvShow);
	});
}

function importTvShow(externalId, done) {
	console.log('First of all we check if we already imported this tvshow (%s)...', externalId);
	
	checkTvShowProcessed(externalId, function(err, hasBeenImported) {
		if (err) return done(err);

		if (!hasBeenImported) {

			async.waterfall([
				function summary(iDone) {
					getTvShowSummary(externalId, function(err, summary) {
						if (err || !summary) {
							iDone(err || new Error('Data not found for tvShow: ' + externalId));
						} else {
							iDone(null, summary);
						}
					});
				},
				getTvShowData,
				saveTvShow
			], done);

		} else {
			console.log('...skipping this one (already imported: %s).', externalId);
			done();
		}
	});
}


mongoose.connect(MONGODB_URL, function(err) {
	if (err) throw err;

	async.whilst(function() {
		return count >= 100;
	}, function(done) {
		console.log('offset: %d - count: %d', offset, count);
		getTvShowsIds(offset, count, function(err, ids) {
			console.log(0);
			if (err) return done(err);
			console.log('TvShows identifiers gathered:', ids.length);

			async.eachSeries(ids, function(id, callback) {
				importTvShow(id, function(iErr, tvShow) {
					if (iErr) {
						console.log('There was a problem importing tvShow: %s. Error: %s', id, iErr);
					} else {
						if (tvShow) { // Skipped tvshows does not return anything
							importedCount++;
							console.log('Processed tvShow: %s - count: %d', tvShow.name, importedCount);
						}
					}
					callback();
				});

			}, function(aErr) {
				count = ids.length;
				offset += count;
				done(aErr);
			});
			
		});
	}, function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log('TvShows import process finished.\nImported tvshows: %d', importedCount);
		}
		mongoose.disconnect();
	});

});

