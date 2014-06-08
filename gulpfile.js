var gulp = require('gulp'),
	sass = require('gulp-sass'),
	plumber = require('gulp-plumber'), // Para que si falla una de las subtareas no rompa todo el proceso
	csso = require('gulp-csso'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	uncss = require('gulp-uncss'),
	templateCache = require('gulp-angular-templatecache');

gulp.task('sass', function() {
	gulp.src('public/stylesheets/style.scss')
		.pipe(plumber())
		.pipe(sass())
		.pipe(uncss({ // TODO No parece estar funcionando
			html: [
				'public/index.html',
				'public/views/add.html',
				'public/views/detail.html',
				'public/views/home.html',
				'public/views/login.html',
				'public/views/signup.html'
			]
		}))
		.pipe(csso())
		.pipe(gulp.dest('public/stylesheets'));
});

gulp.task('compress-client-js', function() {
	gulp.src([
		'public/vendor/angular.js',
		'public/vendor/*.js',
		'public/app.js',
		'public/services/*.js',
		'public/controllers/*.js',
		'public/filters/*.js',
		'public/directives/*.js'
	])
		.pipe(concat('app.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('public'));
});

gulp.task('templates', function() {
	gulp.src('public/views/**/*.html')
		.pipe(templateCache({ root: 'views', module: 'MyApp' }))
		.pipe(gulp.dest('public'));
});

gulp.task('watch', function() {
	gulp.watch('public/stylesheets/*.scss', ['sass']);
	gulp.watch(['public/**/.js', '!public/app.min.js', '!public/vendor'], ['compress']);
});

gulp.task('default', ['sass', 'compress-client-js', 'templates', 'watch']);