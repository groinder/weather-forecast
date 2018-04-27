var gulp = require('gulp'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    minify = require('gulp-minify'),
    ifcondition = require('gulp-if'),
    sourcemaps = require('gulp-sourcemaps');

var DIST_PATH = "dist";
var SRC_PATH = "src";
var DEBUG = true;

gulp.task('default', [
    'js',
    'html',
    'css',
    'img'
]);

gulp.task('clean', function () {
    return gulp.src(DIST_PATH)
        .pipe(clean());
});

gulp.task('js', ['clean'], function () {
    return gulp.src([
            SRC_PATH + '/js/**/app.js',
            SRC_PATH + '/js/**/*.js',])
        .pipe(ifcondition(DEBUG, sourcemaps.init()))
        .pipe(ifcondition(!DEBUG, minify({
            noSource: true,
            mangle: false,
            ignoreFiles: ['.min.js']
        })))
        .pipe(concat('weatherForecast.js'))
        .pipe(ifcondition(DEBUG, sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: 'file:///' + __dirname + '/src/js'
        })))
        .pipe(gulp.dest(DIST_PATH + '/js'));
});

gulp.task('html', ['clean'], function() {
    return gulp.src(SRC_PATH + '/**/*.html').pipe(gulp.dest(DIST_PATH + '/'));
});

gulp.task('css', ['clean'], function() {
    return gulp.src(SRC_PATH + '/css/**/*.css')
        .pipe(concat('styles.css'))
        .pipe(ifcondition(!DEBUG, minify({
            noSource: true,
            mangle: false,
            ignoreFiles: ['.min.css']
        })))
        .pipe(gulp.dest(DIST_PATH + '/css'));
});

gulp.task('img', ['clean'], function() {
    return gulp.src(SRC_PATH + '/img/**/*').pipe(gulp.dest(DIST_PATH + '/img'));
});