'use strict';

var path = require('path'),
	fs = require('fs'),
	sharp = require('sharp'),
	request = require('request');

var REMOTE_IMG_BASE_PATH = 'http://thetvdb.com/banners';

var regexp = /^\/images\/posters\//,
	imagesPath = path.join(__dirname, '..', '..', 'public', 'images');

function _loadRemoteImage(imgRemotePath, callback) {
	console.log('Loading remote image:', imgRemotePath);
	request(REMOTE_IMG_BASE_PATH + imgRemotePath, {encoding: null}, function(error, response, body) {
		var _err = error;
		if (!error && response.statusCode >= 300) {
			_err = new Error('Error serving remote image: ' + response.statusCode);
		}
		callback(_err, body);
	});
}

module.exports = function(req, res, next) {
	var imgPath;

	if (regexp.exec(req.path)) {
		imgPath = path.join(imagesPath, req.path.replace('/images', ''));
		fs.exists(imgPath, function(exists) {
			if (!exists) {
				_loadRemoteImage(req.path.replace('/images', ''), function(err, imgData) {
					if (err) {
						next(err);
					} else {
						res.send(imgData); // Serve remote file
						sharp(imgData).resize(255, null).toFile(imgPath);
					}
				});
			} else {
				next();
			}
		});
	} else {
		process.nextTick(function() {
			next();
		});
	}
};