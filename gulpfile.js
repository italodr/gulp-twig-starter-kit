/***************************************
*
*   Gulpfile
*
***************************************/

/***************************************
*   Available tasks
/***************************************
*   `browserSync`
*   `build`
*   `clean:dist`
*   `clean:release`
*   `css`
*   `concat:json`
*   `concat:scripts`
*   `concat:polyfills`
*   `copy:javascripts`
*   `copy:fonts`
*   `database`
*   `default`
*   `email`
*   `icons`
*   `imagemin`
*   `images`
*   `javascripts`
*   `markup`
*   `serve`
*   `svg-sprite`
*   `watch`
*
***************************************/

/***************************************
 *   Plugins
/***************************************
 *
 * gulp                 : The streaming build system
 * gulp-autoprefixer    : Prefix CSS
 * gulp-changed         : Check if files have changed
 * gulp-check-filesize  : Check the size of files
 * gulp-combine-mq      : Combine media queries
 * gulp-concat          : Concatenate files
 * gulp-csso            : Minify CSS with CSSO
 * gulp-grunt           : Run grunt tasks from gulp (grunticon)
 * gulp-imagemin        : Minify images
 * gulp-load-plugins    : Automatically load Gulp plugins
 * gulp-minify-css      : Minify CSS
 * gulp-minify-html     : Minify HTML
 * gulp-pixrem          : Create fallback of rems to pixel
 * gulp-plumber         : Prevent pipe breaking from errors
 * gulp-rename          : Rename files
 * gulp-replace         : String replace
 * gulp-sass            : Compile Sass
 * gulp-sourcemaps      : Create sourcemaps of CSS
 * gulp-twig            : Compile Twig
 * gulp-uglify          : Minify JavaScript with UglifyJS
 * gulp-util            : Utility functions
 * gulp-yaml            : Convert YAML file into JSON
 * gulp-zip             : Create a zip
 * browser-sync         : Live CSS Reload & Browser Syncing
 * child_process        : Util functions of npm
 * del                  : Delete files/folders using globs
 * fs                   : File parser
 * glob                 : Match files using the patterns the shell uses
 * imagemin-svgo        : Support of imagemin for SVGO
 * run-sequence         : Run a series of dependent Gulp tasks in order
 * vinyl-ftp            : Vinyl adapter for FTP
 *
 ***************************************/

var gulp = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    browserSync = require('browser-sync'),
    del = require('del'),
    exec = require('child_process').exec,
    fs = require('fs'),
    glob = require('glob'),
    svgo = require('imagemin-svgo'),
    runSequence = require('run-sequence'),
    pagespeed = require('psi'),
    config = require('./gulp.config.json');

var $ = gulpLoadPlugins({
    camelize: true,
    rename : {
        'gulp-util' : 'gutil'
    }
});
var reload = browserSync.reload,
    routes = config.routes,
    vars = config.vars,
    timestamp = new Date().getTime();

$.grunt(gulp);

// -------------------------------------
//   Functions
// -------------------------------------
function consoleLog(message, kaomoji) {
    kaomoji = kaomoji || 'writing';
    $.gutil.log(vars.kaomoji[kaomoji] +' '+ message);
}

function errorAlert(error) {
    var quotes       = $.gutil.colors.gray('\''),
        message      = 'Error compiling. '+ error.message +' ',
        fileName     = quotes + $.gutil.colors.cyan('Error') + quotes,
        errorMessage = $.gutil.colors.red(message + vars.kaomoji.fuck);

	$.notify.onError({
        title: 'You have an error!  ' + vars.kaomoji.fuck,
        message: 'Please, check your terminal.',
        sound: 'Sosumi'
    })(error);
	consoleLog(errorMessage, 'fuck');
	this.emit('end');
}

function parseJsonFiles() {
    var data = fs.readFileSync(routes.src.data +'/data.json', 'utf-8');
    data = JSON.parse(data.toString());
    return data;
}

// -------------------------------------
//   Options
// -------------------------------------

var options = {
    // ----- Default ----- //
    default : {
        tasks : [ 'build', 'serve' ]
    },

    // ----- Browser Sync ----- //
    browsersync : {
        args : {
            server: { baseDir: routes.dest.base +'/' },
            options: { reloadDelay: 250 },
            notify: false
        }
    },

    // ----- Build ----- //
    build : {
        tasks : [ 'clean:dist', 'images', 'css', 'markup', 'javascripts',
                'copy:fonts' ]
    },

    // ----- CSS ----- //
    css : {
        message : 'Compiling Scss',
        files : [
            routes.src.scss +'/**/*.scss',
            routes.src.markup +'/**/*.scss'
        ],
        destination: routes.dest.scss,
        scss_args : {
            sourceComments : 'map',
            imagePath : routes.src.image
        },
        combineMq_args : { beautify: true },
        autoprefixer_args : {
            browsers : [
                'last 2 versions',
                'ie >= 9',
                'ie_mob >= 10'
            ],
            cascade : true
        },
        sourcemaps_args : { includeContent : false }
    },

    // ----- Clean ----- //
    clean : {
        dist : {
            files : routes.dest.base +'/**/*',
            message : 'Delete destination folder'
        }
    },

    // ----- Concat ----- //
    concat : {
        json : {
            files : [
                routes.src.data +'/*.yml',
                routes.src.markup +'/**/*.yml',
                '!'+ routes.src.data +'/data.yml'
            ],
            file : 'data.yml',
            destination : routes.src.data
        },
        polyfills : {
            files : [
                routes.src.javascript +'/polyfills/selectivizr.js',
                routes.src.javascript +'/polyfills/respond.js'
            ],
            file : 'polyfills.js',
            destination : routes.dest.javascript
        },
        scripts : {
            files : [
                routes.src.javascript +'/components/**/*',
                routes.src.markup +'/**/*.js',
                routes.src.javascript +'/*'
            ],
            file : 'scripts.js',
            destination : routes.dest.javascript
        }
    },

    // ----- Copy ----- //
    copy : {
        javascripts : {
            files : routes.src.javascript +'/libs/**/*',
            destination : routes.dest.javascript +'/libs'
        },
        fonts : {
            files : routes.src.fonts +'/**/*',
            destination : routes.dest.fonts
        }
    },

    // ----- Imagemin ----- //
    imagemin : {
        files: [
            routes.src.image + '/**/*',
            routes.src.svg + '/**/*'
        ],
        args : {
            progressive: true,
            interlaced: true
        },
        svgo : {
            plugins: [
                { removeViewBox : false },
                { removeEmptyAttrs : false },
                { removeComments : true },
                { removeTitle : true }
            ]
        },
        destination : routes.dest.image
    },

    // ----- Images ----- //
    images : {
        tasks : [ 'imagemin', 'svg-sprite' ]
    },

    // ----- Javascripts ----- //
    javascripts : {
        tasks : [ 'concat:scripts', 'concat:polyfills', 'copy:javascripts' ]
    },

    // ----- Markup ----- //
    markup : {
        tasks : [ 'concat:json' ],
        files : [
            routes.src.markup +'/**/*.twig',
            '!'+ routes.src.markup +'/**/_*.twig',
            '!'+ routes.src.markup +'/includes/**/*.twig',
            '!'+ routes.src.markup +'/modules/**/*.twig'
        ],
        watch : [ routes.src.base +'/*.twig' ],
        destination : routes.dest.base,
        data : routes.src.data +'/data.json',
        minify : {
            conditionals : true,
            empty : true
        }
    },

    // ----- Pagespeed ----- //
    pagespeed : {
        url : 'example.com',
        args : {
            strategy: 'mobile'
            // By default we use the PageSpeed Insights free (no API key) tier.
            // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
            // key: 'YOUR_API_KEY'
        }
    },

    // ----- Serve ----- //
    serve : {
        tasks : [ 'browserSync', 'watch' ]
    },

    // ----- SVG ----- //
    svg : {
        tasks : [ 'grunt-grunticon' ],
        files : routes.tmp + '/*.css',
        destination : routes.dest.scss
    },

    // ----- Watch ----- //
    watch : {
        tasks : [],
        files : function() {
            return [
                options.css.files,
                options.markup.watch,
                options.imagemin.files,
                options.concat.json.files,
                options.concat.scripts.files
            ]
        },
        run : function() {
            return [
                [ 'css', reload ],
                [ 'markup', reload ],
                [ 'images', reload ],
                [ 'markup', reload ],
                [ 'javascripts', reload ]
            ]
        }
    }
};

// -------------------------------------
//   Task: Browser Sync
// -------------------------------------

gulp.task('browserSync', function() {
    browserSync(options.browsersync.args);
});

// -------------------------------------
//   Task: Build
// -------------------------------------

gulp.task('build', function(callback) {
    var tasks = options.build.tasks;
    tasks.push(callback);
    runSequence.apply(null, tasks);
});

// -------------------------------------
//   Task: Clean: Destination
// -------------------------------------

gulp.task('clean:dist', function() {
    return del(options.clean.dist.files, function(err, deletedFiles) {
        consoleLog(options.clean.dist.message, 'crazy');
        if (!err) errorAlert(err);
    });
});

// -------------------------------------
//   Task: CSS
// -------------------------------------

gulp.task('css', function() {
    consoleLog(options.css.message, 'writing');
    return gulp.src(options.css.files)
        .pipe($.plumber({ errorHandler: errorAlert }))
        // .pipe($.csso())
        .pipe($.sourcemaps.init())
        .pipe($.sass(options.css.scss_args))
        .pipe($.combineMq(options.css.combineMq_args))
        .pipe($.replace(/\{\*timestamp\*\}/g, opts.timestamp))
        .pipe($.pixrem())
        .pipe($.autoprefixer(options.css.autoprefixer_args))
        .pipe($.sourcemaps.write('.', options.css.sourcemaps_args))
        .pipe(gulp.dest(options.css.destination))
        .pipe($.rename({ suffix : '.min' }))
        .pipe($.size({ title : 'css' }))
        .pipe(gulp.dest(options.css.destination));
});

// -------------------------------------
//   Task: Concat: Json
// -------------------------------------

gulp.task('concat:json', function() {
    return gulp.src(options.concat.json.files)
        .pipe($.plumber({ errorHandler: errorAlert }))
        .pipe($.concat(options.concat.json.file))
        .pipe(gulp.dest( options.concat.json.destination ))
        .pipe($.yaml())
        .pipe(gulp.dest( options.concat.json.destination ));
});

// -------------------------------------
//   Task: Concat: Scripts
// -------------------------------------

gulp.task('concat:scripts', function() {
    return gulp.src(options.concat.scripts.files)
        .pipe($.plumber({ errorHandler: errorAlert }))
        .pipe($.concat(options.concat.scripts.file, { newLine: ';' }))
        .pipe($.uglify())
        .pipe($.size({ title : 'js' }))
        .pipe(gulp.dest(options.concat.scripts.destination));
});

// -------------------------------------
//   Task: Concat: Polyfills
// -------------------------------------

gulp.task('concat:polyfills', function() {
    return gulp.src(options.concat.polyfills.files)
        .pipe($.uglify())
        .pipe($.concat(options.concat.polyfills.file, { newLine: ';' }))
        .pipe($.size({ title : 'polyfills' }))
        .pipe(gulp.dest(options.concat.polyfills.destination));
});

// -------------------------------------
//   Task: Copy: Javascripts
// -------------------------------------

gulp.task('copy:javascripts', function() {
    return gulp.src(options.copy.javascripts.files)
        .pipe($.size({ title : 'libs', showFiles: true }))
        .pipe(gulp.dest(options.copy.javascripts.destination));
});

// -------------------------------------
//   Task: Copy: Fonts
// -------------------------------------

gulp.task('copy:fonts', function() {
    return gulp.src(options.copy.fonts.files)
        .pipe(gulp.dest(options.copy.fonts.destination));
});

// -------------------------------------
//   Task: Default
// -------------------------------------

gulp.task('default', function(callback) {
    var tasks = options.default.tasks;
    tasks.push(callback);
    runSequence.apply(null, tasks);
});

// -------------------------------------
//   Task: Imagemin
// -------------------------------------

gulp.task('imagemin', function() {
    return gulp.src(options.imagemin.files)
        .pipe($.imagemin(options.imagemin.args))
        .pipe(svgo(options.imagemin.svgo)())
        .pipe(gulp.dest(options.imagemin.destination));
});

// -------------------------------------
//   Task: Images
// -------------------------------------

gulp.task('images', options.images.tasks);

// -------------------------------------
//   Task: Javascripts
// -------------------------------------

gulp.task('javascripts', options.javascripts.tasks);

// -------------------------------------
//   Task: Lint
// -------------------------------------

gulp.task('lint', function() {
    gulp.src(routes.src.javascripts +'*.js')
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failOnError()))
});

// -------------------------------------
//   Task: Markup
// -------------------------------------

gulp.task('markup', options.markup.tasks, function() {
    if (!fs.existsSync(options.markup.data)) {
        errorAlert();
        return true;
    }

    var data = parseJsonFiles(),
        twig_args = {
        data: data,
        cache: false,
        functions: [],
        filters: []
    };

    return gulp.src(options.markup.files)
        .pipe($.twig(twig_args))
        .pipe($.replace(/\{\*timestamp\*\}/g, opts.timestamp))
        .pipe($.minifyHtml(options.markup.minify))
        .pipe($.size({ title : 'html' }))
        .pipe(gulp.dest(options.markup.destination))
        .pipe(browserSync.reload({ stream : true }));
});

// -------------------------------------
//   Task: Pagespeed
// -------------------------------------

gulp.task('pagespeed', function(callback) {
    pagespeed(options.pagespeed.url, options.pagespeed.args, callback)
});

// -------------------------------------
//   Task: Serve
// -------------------------------------

gulp.task('serve', options.serve.tasks);

// -------------------------------------
//   Task: SVG Sprites
// -------------------------------------

gulp.task('svg-sprite', options.svg.tasks, function() {
    gulp.src(options.svg.files)
        .pipe($.csso())
        .pipe($.rename({ suffix:'.min' }))
        .pipe($.size({ title : 'grunticon' }))
        .pipe(gulp.dest(options.svg.destination))
});

// -------------------------------------
//   Task: Watch
// -------------------------------------

gulp.task( 'watch', function() {
    var watchFiles = options.watch.files();
    watchFiles.forEach( function( files, index ) {
        gulp.watch( files, options.watch.run()[ index ] );
    });
});
