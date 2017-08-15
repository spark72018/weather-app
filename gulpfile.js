const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass'); 
const browserSync = require('browser-sync').create();
const surge = require('gulp-surge');

gulp.task('babelize', () => {
    gulp.src('app/es6/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('app/js'));
});

gulp.task('sass', () => {
    gulp.src('app/sass/**/*.sass')
        .pipe(sass({sourceComments: 'normal'})) // using gulp-sass
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// create browserSync task to enable Gulp to spin up a server using
// Browser Sync. We also need to let Browser Sync know where the root
// of the server should be. In this case, the 'app' folder.
gulp.task('browserSync', () => {
    browserSync.init({
        server: {
            baseDir: './'
        }
    });
});

gulp.task('surge', [], () => surge({
    project: './',
    domain: 'daft-weather-app.surge.sh'
}))
// would be cumbersome to open up two command line windows
// and run gulp browserSync and gulp watch separately. So make 
// Gulp run them together by telling 'watch' task that browserSync
// must be completed before 'watch' is allowed to run. This is done
// by adding second argument to the 'watch' task. 
gulp.task('watch', ['browserSync', 'babelize'], function() {
    gulp.watch('app/es6/**/*.js', ['babelize']);
    gulp.watch('app/sass/**/*.sass', ['sass']);
    gulp.watch('app/css/**/*.css', browserSync.reload);
    gulp.watch('*.html', browserSync.reload);
    gulp.watch('app/js/**/*.js', browserSync.reload);
});
