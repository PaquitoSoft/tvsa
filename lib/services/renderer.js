'use strict';

var fs = require('fs'),
	_path = require('path'),
	async = require('async'),
	Ractive = require('ractive'),
	viewHelpers = require('./view-helpers');

var MAIN_LAYOUT_PATH = _path.join(__dirname, '..', '..', 'views', 'main-layout.html');

// Set view helpers globally to all ractive instances
for (var key in viewHelpers) {
	Ractive.defaults.data[key] = viewHelpers[key];
}

function render(path, options, done) {
	var t1 = Date.now();
	console.log('Renderer::render# Path:', path);
	// console.log('Renderer::render# Data:', options);
	
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