'use strict';

var fs = require('fs'),
	_path = require('path'),
	async = require('async'),
	Ractive = require('ractive');

var MAIN_LAYOUT_PATH = _path.join(__dirname, '..', '..', 'views', 'main-layout.html');

function render(path, options, done) {
	var t1 = Date.now();
	console.log('Renderer::render# Path:', path);
	
	async.parallel({
		layout: function (next) {
			fs.readFile(MAIN_LAYOUT_PATH, { encoding: 'utf8' }, next);
		},
		partial: function (next) {
			fs.readFile(path, { encoding: 'utf8' }, next);
		}
	}, function(err, data) {
		if (err) return done(err);

		var html = new Ractive({
			template: data.layout,
			partials: {
				mainContent: data.partial
			},
			data: options
		}).toHTML();

		console.log('Renderer::render# Time to render:', Date.now() - t1, '(ms)');

		done(null, html);
	});

}

module.exports = render;