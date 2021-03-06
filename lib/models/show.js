'use strict';

var mongoose = require('mongoose');

var showSchema = new mongoose.Schema({
	_id: Number,
	externalId: String,
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
		overview: String,
		ratingCount: Number,
		ratingValue: Number,
		poster: String
	}]
});

module.exports = mongoose.model('Show', showSchema);