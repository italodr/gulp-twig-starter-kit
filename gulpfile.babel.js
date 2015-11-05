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
*   `markup:generate`
*   `publish`
*   `publish:set`
*   `publish:build`
*   `release`
*   `release:zip`
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
 * gulp-email           : Send email
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

 'use strict';

 // Babel handles the use of new JavaScript features.
 // Learn more at: https://babeljs.io/docs/learn-es2015/

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import childProcess from 'child_process';
import fs from 'fs';
import glob from 'glob';
import svgo from 'imagemin-svgo';
import runSequence from 'run-sequence';
import {output as pagespeed} from 'psi';

const $ = gulpLoadPlugins({
    camelize: true,
    rename : {
        'gulp-util' : 'gutil'
    }
});
const exec = childProcess.exec;
const reload = browserSync.reload;

$.grunt( gulp );

// -------------------------------------
//   Functions
// -------------------------------------
function notify( message, kaomoji )
{
    kaomoji = kaomoji || 'writing';
    $.gutil.log( opts.kaomoji[kaomoji] +' '+ message );
}

function throwError( err )
{
    let quotes       = $.gutil.colors.gray('\''),
        message      = 'Error compiling. '+ err +' ',
        fileName     = quotes + $.gutil.colors.cyan('Error') + quotes,
        errorMessage = $.gutil.colors.red(message + opts.kaomoji.fuck);

    $.gutil.log( fileName, errorMessage );
}

function parseJsonFiles()
{
    let data = fs.readFileSync(routes.src.data +'/data.json', 'utf-8');
    data = JSON.parse( data.toString() );
    opts.json_data = data;
}

// -------------------------------------
//   Routes
// -------------------------------------
const routes = {
    tmp : '.tmp',
    src : {
        base : 'src',
        data : 'src/data',
        markup : 'src/markup',
        scss : 'src/assets/scss',
        fonts : 'src/assets/fonts',
        image : 'src/assets/images',
        svg : 'src/assets/images/svg-icons',
        javascript : 'src/assets/javascripts'
    },
    dest : {
        base : 'dist',
        scss : 'dist/assets/stylesheets',
        javascript : 'dist/assets/javascripts',
        fonts : 'dist/assets/fonts',
        image : 'dist/assets/images',
        svg : 'dist/assets/images/svg-icons'
    }
};

// -------------------------------------
//   Variables
// -------------------------------------
const timestamp = new Date().getTime();
var opts = {
    json_data : {},
    kaomoji : {
        common :  '(」゜ロ゜)」',
        crazy :   '(⊙_◎)',
        fuck :    '(╯°□°）╯︵ ┻━┻',
        start :   '(ﾉ･ｪ･)ﾉ',
        yeah :    '＼（＠￣∇￣＠）／',
        writing : '＿〆(。。)'
    }
};

// -------------------------------------
//   Options
// -------------------------------------

const options = {
    // ----- Default ----- //
    default : {
        tasks : [ 'watch' ]
    },

    // ----- Browser Sync ----- //
    browsersync : {
        tasks : [ 'build' ],
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
        sourcemaps_args : { includeContent : false },
        minifyCss_args : { keepSpecialComments : 0 }
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

    // ----- SVG ----- //
    svg : {
        tasks : [ 'grunt-grunticon' ],
        files : routes.tmp + '/*.css',
        destination : routes.dest.scss
    },

    // ----- Watch ----- //
    watch : {
        tasks : [ 'browserSync' ],
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

gulp.task( 'browserSync', options.browsersync.tasks, () =>
    browserSync( options.browsersync.args )
);

// -------------------------------------
//   Task: Build
// -------------------------------------

gulp.task( 'build', ( callback ) => {
    let tasks = options.build.tasks;
    tasks.push( callback );
    runSequence.apply( null, tasks );
});

// -------------------------------------
//   Task: Clean: Destination
// -------------------------------------

gulp.task( 'clean:dist', () => {
    return del( options.clean.dist.files, ( err, deletedFiles ) => {
        notify( options.clean.dist.message, 'crazy' );
        if ( !err ) throwError( err );
    });
});

// -------------------------------------
//   Task: CSS
// -------------------------------------

gulp.task( 'css', () => {
    notify( options.css.message, 'writing' );
    return gulp.src( options.css.files )
        .pipe( $.plumber( (error) => {
            notify( error.message, 'fuck' );
            this.emit( 'end' );
        }))
        .pipe( $.sourcemaps.init() )
        .pipe( $.sass( options.css.scss_args ))
        .pipe( $.combineMq( options.css.combineMq_args ))
        .pipe( $.replace(/\{\*timestamp\*\}/g, opts.timestamp) )
        .pipe( $.pixrem() )
        .pipe( $.autoprefixer( options.css.autoprefixer_args ))
        .pipe( $.sourcemaps.write( '.', options.css.sourcemaps_args ))
        .pipe( gulp.dest( options.css.destination ))
        .pipe( $.minifyCss( options.css.minifyCss_args ))
        .pipe( $.rename({ suffix : '.min' }) )
        .pipe( $.csso() )
        .pipe( $.size({ title : 'css' }) )
        .pipe( gulp.dest( options.css.destination ));
});

// -------------------------------------
//   Task: Concat: Json
// -------------------------------------

gulp.task( 'concat:json', () => {
    return gulp.src( options.concat.json.files )
        .pipe( $.plumber({ errorHandler: throwError }) )
        .pipe( $.concat( options.concat.json.file ))
        .pipe( gulp.dest(  options.concat.json.destination  ))
        .pipe( $.yaml() )
        .pipe( gulp.dest(  options.concat.json.destination  ));
});

// -------------------------------------
//   Task: Concat: Scripts
// -------------------------------------

gulp.task( 'concat:scripts', () => {
    return gulp.src( options.concat.scripts.files )
        .pipe( $.plumber( (error) => {
            notify(error.message, 'fuck');
            this.emit('end');
        }))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe( $.concat( options.concat.scripts.file, { newLine: ';' } ))
        .pipe( $.uglify() )
        .pipe( $.size({ title : 'js' }))
        .pipe( gulp.dest( options.concat.scripts.destination ));
});

// -------------------------------------
//   Task: Concat: Polyfills
// -------------------------------------

gulp.task( 'concat:polyfills', () => {
    return gulp.src( options.concat.polyfills.files )
        .pipe( $.uglify() )
        .pipe( $.concat(options.concat.polyfills.file, { newLine: ';' }) )
        .pipe( $.size({ title : 'polyfills' }) )
        .pipe( gulp.dest( options.concat.polyfills.destination ) );
});

// -------------------------------------
//   Task: Copy: Javascripts
// -------------------------------------

gulp.task( 'copy:javascripts', () => {
    return gulp.src( options.copy.javascripts.files )
        .pipe( $.size({ title : 'libs', showFiles: true }))
        .pipe( gulp.dest( options.copy.javascripts.destination ));
});

// -------------------------------------
//   Task: Copy: Fonts
// -------------------------------------

gulp.task( 'copy:fonts', () => {
    return gulp.src( options.copy.fonts.files )
        .pipe( gulp.dest( options.copy.fonts.destination ));
});

// -------------------------------------
//   Task: Default
// -------------------------------------

gulp.task( 'default', options.default.tasks );

// -------------------------------------
//   Task: Imagemin
// -------------------------------------

gulp.task('imagemin', () => {
    return gulp.src( options.imagemin.files )
        .pipe( $.imagemin( options.imagemin.args ))
        .pipe( svgo( options.imagemin.svgo )())
        .pipe( gulp.dest( options.imagemin.destination ));
});

// -------------------------------------
//   Task: Images
// -------------------------------------

gulp.task( 'images', options.images.tasks );

// -------------------------------------
//   Task: Javascripts
// -------------------------------------

gulp.task( 'javascripts', options.javascripts.tasks );

// -------------------------------------
//   Task: Markup
// -------------------------------------

gulp.task('markup', options.markup.tasks, () => {
    if (!fs.existsSync( options.markup.data )) {
        throwError();
        return true;
    }
    parseJsonFiles();

    let args = {
        data: opts.json_data,
        cache: false,
        functions: [],
        filters: []
    };

    return gulp.src( options.markup.files )
        .pipe( $.twig( args ))
        .pipe( $.replace( /\{\*timestamp\*\}/g, opts.timestamp ))
        .pipe( $.minifyHtml( options.markup.minify ))
        .pipe( $.size({ title : 'html' }))
        .pipe( gulp.dest( options.markup.destination ))
        .pipe( browserSync.reload( { stream : true } ));
});

// -------------------------------------
//   Task: Pagespeed
// -------------------------------------

gulp.task('pagespeed', callback =>
    pagespeed( options.pagespeed.url, options.pagespeed.args, callback )
);

// -------------------------------------
//   Task: SVG Sprites
// -------------------------------------

gulp.task( 'svg-sprite', options.svg.tasks, () =>
    gulp.src( options.svg.files )
        .pipe( $.csso() )
        .pipe( $.rename({ suffix:'.min' }))
        .pipe( $.size({ title : 'grunticon' }))
        .pipe( gulp.dest( options.svg.destination ))
);

// -------------------------------------
//   Task: Watch
// -------------------------------------

gulp.task( 'watch', options.watch.tasks, () => {
    var watchFiles = options.watch.files();
    watchFiles.forEach( ( files, index ) =>
        gulp.watch( files, options.watch.run()[ index ] )
    );
});
