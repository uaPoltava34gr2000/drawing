var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var watchify = require('watchify');

var jsSrcDir = './src/main/resources/web/js';
var jsEntryFile = jsSrcDir + '/main.js';
var jsBundleFile = 'bundle.min.js';
var jsDstDir = './src/main/resources/static/js';

var scssEntryFiles = './src/main/resources/web/style/*.scss';
var scssWatchFiles = './src/main/resources/web/style/**/*.scss';
var cssDstDir = './src/main/resources/static/css/';

function buildBundle(obfuscate, watch) {
  var bundler = browserify({
    entries: [jsEntryFile],
    debug: false,
    cache: {},
    packageCache: {},
    extensions: ['.js', '.json', '.jsx'],
    paths: [jsSrcDir],
    fullPaths: false
  });

  bundler = bundler.transform('babelify', {presets: ['es2015', 'react']});

  function bundle(b) {
    var startMs = Date.now();
    var db = b.bundle()
        .on('error', function(err) {
          console.log(err.message);
          this.emit('end');
        })
        .pipe(source(jsBundleFile))
    if (obfuscate) {
      db.pipe(streamify(uglify()));
    }
    db.pipe(gulp.dest(jsDstDir));
    console.log('Updated bundle file in', (Date.now() - startMs) + 'ms');
    return db;
  }

  if (watch) {
    bundler = watchify(bundler)
        .on('update', function() {
          bundle(bundler);
        });
  }

  return bundle(bundler);
}

gulp.task('build-js', function() {
  buildBundle(false, false);
});

gulp.task('watch-js', function() {
  buildBundle(false, true);
});

gulp.task('release-js', function() {
  buildBundle(true, false);
});

function buildCss(minify) {
  // TODO(d): Support minification
  return gulp.src(scssEntryFiles)
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest(cssDstDir));
}

gulp.task('build-sass', function () {
  buildCss(false);
});

gulp.task('watch-sass', function () {
  var watcher = gulp.watch(scssWatchFiles, ['build-sass']);
  watcher.on('change', function(e) {
    console.log('Recompiling SASS because file changed: ' + e.path);
  });
});

gulp.task('release-sass', function () {
  buildCss(true);
});

gulp.task('default', ['build-js', 'build-sass']);
gulp.task('release', ['release-js', 'release-sass']);
gulp.task('dev', ['watch-js', 'watch-sass']);
