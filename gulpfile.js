/***************************************
*
*   Gulpfile
*
/***************************************
*
*  Gulp Starter Kit
*  Created by italodr <italodr.com>
*
* Copyright © 2015 Italo Devoto Ramella <italodr@gmail.com>
* This work is free. You can redistribute it and/or modify it under the
* terms of the Do What The Fuck You Want To Public License, Version 2,
* as published by Sam Hocevar. See the COPYING file for more details.
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

var gulp        = require( 'gulp' ),
    browserSync = require( 'browser-sync' ),
    exec        = require( 'child_process' ).exec,
    del         = require( 'del' ),
    fs          = require( 'fs' ),
    glob        = require( 'glob' ),
    svgo        = require( 'imagemin-svgo' ),
    runSequence = require( 'run-sequence' ),
    ftp         = require( 'vinyl-ftp' ),
    plugins     = require( 'gulp-load-plugins' )({
        camelize: true,
        rename : {
            'gulp-util' : 'gutil'
        }
    });

require( 'gulp-grunt' )( gulp );

// -------------------------------------
//   Funtions
// -------------------------------------
function notify( message, kaomoji )
{
    kaomoji = kaomoji || 'writing';
    plugins.gutil.log( opts.kaomoji[kaomoji] +' '+ message );
}

function throwError( err )
{
    var quotes       = plugins.gutil.colors.gray('\''),
        message      = 'Error compiling. '+ err +' ',
        fileName     = quotes + plugins.gutil.colors.cyan('Error') + quotes,
        errorMessage = plugins.gutil.colors.red(message + opts.kaomoji.fuck);

    plugins.gutil.log( fileName, errorMessage );
}

function getEmailOptions( landing )
{
    var emailTo = json_data.common.email.to,
        emailCc = json_data.common.email.cc;

    options.email_api.form.subject = '[EROSKI] Landing '+ landing;
    options.email_api.form.attachment = '@'+ routes.dest.release +'/landing-'+ landing +'.zip';
    options.email_api.form_string.html = '<p>Hola, <br>Adjunto la landing de '+ landing +' de EROSKI</p>';

    if ( emailTo !== undefined && emailTo !== '' ) options.email_api.form.to = emailTo;
    if ( emailCc !== undefined && emailCc !== '' ) options.email_api.form.cc = emailCc;

    return opts.email_api;
}

function sendReleaseEmail(landing)
{
    var args = getEmailOptions( landing );
    return gulp.src([ routes.src.email ])
        .pipe( plugins.email( args ) );
}

function parseJsonFiles()
{
    var products = fs.readFileSync(routes.src.data +'/products.json', 'utf-8'),
        data     = fs.readFileSync(routes.src.data +'/data.json', 'utf-8');

    products = JSON.parse( products.toString() );
    data     = JSON.parse( data.toString() );

    opts.json_products   = products;
    opts.json_data       = data;
    opts.pageName = data.common.name;
    opts.pageSlug = data.common.slug;
}

function generateMarkup( key )
{
    opts.current_product_id = key;
    var file_name = opts.json_products[key].type.toLowerCase() +'-'+ opts.json_products[key].slug.toLowerCase(),
        args = {
        data: {
            _id: opts.current_product_id,
            data: opts.json_data,
            products: opts.json_products
        },
        cache: false,
        functions: twig_options.functions,
        filters: twig_options.filters
    };
    return gulp.src( options.generate.files )
        .pipe( plugins.twig( args ))
        .pipe( plugins.replace( /\{\*timestamp\*\}/g, opts.timestamp ))
        .pipe( plugins.minifyHtml( options.generate.minify ))
        .pipe( plugins.checkFilesize({ fileSizeLimit : 50000 }))
        .pipe( plugins.rename({ basename : file_name }))
        .pipe( gulp.dest( options.generate.destination ))
        .pipe( browserSync.reload( { stream : true } ));
}

function renameIndexFile( landing )
{
    var files = options.rename.files.replace(/%s/g, landing);
    opts.current_landing = landing;
    gulp.src( files )
        .pipe( plugins.rename({ basename: 'index' }))
        .pipe( gulp.dest( options.rename.destination ));

    var result = generateZip( landing );
    return result;
}

function generateZip( landing )
{
    return gulp.src( options.zip.files )
        .pipe( plugins.zip( 'landing-'+ landing +'.zip' ))
        .pipe( gulp.dest( options.zip.destination ));
}

function getUrlPrefix( page )
{
    var url = '';

    if (opts.isRelease) {
        url = '/'+ page.releaseUrl +'/';

    } else if (opts.isPublish) {
        url = '/'+ page.publishUrl +'/'+ opts.pageSlug +'/';
    }

    return url;
}

function getLandingPath( data, landing, page )
{
    var url = 'index_'+ landing +'.html';
    if ( page === undefined ) {
        page = '';
    } else {
        page = landing +'-'+ page +'.html';
        url = page;
    }

    if ( opts.isRelease ) {
        url = 'http://www.eroski.es/'+ data.releaseUrl +'/'+ page;
    }

    return url;
}

function getAttribute( product, attr )
{
    var floaters = ['price', 'discounted_price'],
        iterables = ['categories', 'age', 'sex', 'recipes', 'pairing'],
        attr = attr.toString(),
        result;

    if ( !product ) { return; }

    if ( !product.hasOwnProperty( attr )) {
        result = ( iterables.indexOf( attr ) >= 0 ) ? [] : '';
        return result;
    }
    result = product[ attr ].toString();

    if ( floaters.indexOf( attr ) >= 0 ) {
        result = parseFloat( result ).toFixed(2);
    }

    if ( iterables.indexOf( attr ) >= 0 ) {
        result = result.split(',');
    }

    return result;
}

// -------------------------------------
//   Routes
// -------------------------------------
var routes = {
        tmp : '.tmp',
        src : {
            base : 'src',
            data : 'src/data',
            markup : 'src/markup',
            scss : 'src/assets/scss',
            fonts : 'src/assets/fonts',
            image : 'src/assets/images',
            svg : 'src/assets/images/svg-icons',
            javascript : 'src/assets/javascripts',
            email : 'src/emails/landings.html'
        },
        dest : {
            base : 'dist',
            release : 'release',
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
var opts = {
    timestamp : new Date().getTime(),
    isPublish : false,
    isRelease : false,
    landings : [ 'frescos', 'bodega', 'recomendados', 'regalos' ],
    json_data : {},
    json_products : {},
    icons : [],
    pageName : '',
    pageSlug : '',
    current_product_id : null,
    current_landing : null,
    google_spreadsheet_id : '1QM_UQ1uVyMWmQumu0W0E716CU7c5mJvPT1n-vG9lwmo',
    conn : null,
    kaomoji : {
        common :  '(」゜ロ゜)」',
        crazy :   '(⊙_◎)',
        fuck :    '(╯°□°）╯︵ ┻━┻',
        start :   '(ﾉ･ｪ･)ﾉ',
        yeah :    '＼（＠￣∇￣＠）／',
        writing : '＿〆(。。)'
    }
};


var twig_options = {
    functions : [
        {
            name: 'getUrlPrefix',
            func: getUrlPrefix
        },
        {
            name: 'getLandingPath',
            func: getLandingPath
        }
    ],
    filters : [
        {
            name: 'getAttribute',
            func: getAttribute
        }
    ]
};

// -------------------------------------
//   Options
// -------------------------------------

var options = {
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
        tasks : [ 'clean:dist', 'images', 'css', 'markup', 'markup:generate',
                 'javascripts', 'copy:fonts' ]
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
            browsers : [ 'last 2 versions', 'ie 9' ],
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
        },
        release : {
            files : routes.dest.release +'/**/*',
            message : 'Delete release folder'
        }
    },

    // ----- Concat ----- //
    concat : {
        json : {
            files : [
                routes.src.data + '/*.yml',
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

    // ----- Database ----- //
    database : {
        google_api : "curl -X POST --data 'client_secret=kRChwkaNDB87bmS72S6n-sQm&grant_type=refresh_token&refresh_token=1%2Fbhdg655IUOxGLZPheBV_a63-Y5cES7XPtfUtgQZ2b-TBactUREZofsF9C7PrpE-j&client_id=831715337849-pb4miaigi1e42kq7k1c94jp93poaj6a8.apps.googleusercontent.com' https://www.googleapis.com/oauth2/v3/token"
    },

    // ----- Email ----- //
    email : {
        message : 'Sending attachment of '
    },

    // ----- Email API ----- //
    email_api : {
        user : 'api:key-2f65326a0e518bc9cbb0d72aa3a612db',
        url : 'https://api.mailgun.net/v3/sandbox2d44580c602e455db66f8decb2d976c5.mailgun.org/messages',
        form : {
            from : 'EROSKI Landings <no-reply@runroom.com>',
            to : 'Italo <italo@runroom.com>',
            cc : '',
            subject : '',
            attachment : ''
        },
        form_string : {
            html : ''
        }
    },

    // ----- Generate ----- //
    generate : {
        files : [ routes.src.base +'/_generate.twig' ],
        destination : routes.dest.base,
        minify : {
            conditionals : true,
            empty : true
        }
    },

    // ----- Icons ----- //
    icons : {
        match_pattern : routes.src.svg +'/',
        files : routes.src.svg +'/*.svg'
    },

    // ----- Imagemin ----- //
    imagemin : {
        files: [
            routes.src.image + '/**/*',
            routes.src.svg + '/**/*',
            '!'+ routes.srcImages + '/_old/**/*'
        ],
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
        tasks : [ 'concat:json', 'icons' ],
        files : [
            routes.src.base +'/*.twig',
            '!'+ routes.src.base +'/_*.twig'
        ],
        destination : routes.dest.base,
        data : routes.src.data +'/data.json',
        minify : {
            conditionals : true,
            empty : true
        }
    },

    // ----- Publish ----- //
    publish : {
        tasks : [ 'publish:build' ],
        globs : [ 'dist/**/*' ],
        args : {
            base:   '',
            buffer: false
        },
        build : {
            tasks : [ 'publish:set', 'database', 'build' ]
        },
        ftp : {
            host:     'www.runroomclients.com',
            user:     'runroomclients',
            password: 'sp_F3Ab+',
            reload:   true,
            log:      plugins.gutil.log
        },
        message : 'Uploading to runroomclients.com/eroski/landings/%s',
        destination : '/runroomclients.com/eroski/landings/%s'
    },

    // ----- Release ----- //
    release : {
        tasks : [ 'clean:release', 'database', 'build', 'release:zip', 'email' ]
    },

    // ----- Rename ----- //
    rename : {
        files : routes.dest.base + '/index_%s.html',
        destination : routes.dest.base
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
                options.markup.files,
                options.generate.files,
                options.imagemin.files,
                options.concat.scripts.files
            ]
        },
        run : function() {
            return [
                [ 'css' ],
                [ 'markup' ],
                [ 'markup:generate' ],
                [ 'images' ],
                [ 'javascripts' ]
            ]
        }
    },

    // ----- ZIP ----- //
    zip : {
        files : [
            routes.dest.base + '/index.html',
            routes.dest.base + '/'+ opts.current_landing +'-*.html',
            routes.dest.base + '/assets',
        ],
        destination : routes.dest.release
    }
};

// -------------------------------------
//   Task: Browser Sync
// -------------------------------------

gulp.task( 'browserSync', options.browsersync.tasks, function() {
    browserSync( options.browsersync.args );
});

// -------------------------------------
//   Task: Build
// -------------------------------------

gulp.task( 'build', function( callback ) {
    var tasks = options.build.tasks;
    tasks.push(callback);
    runSequence.apply(null, tasks);
});

// -------------------------------------
//   Task: Clean: Destination
// -------------------------------------

gulp.task( 'clean:dist', function () {
    return del( options.clean.dist.files, function ( err, deletedFiles ) {
        notify( options.clean.dist.message, 'crazy' );
    });
});

// -------------------------------------
//   Task: Clean: Release
// -------------------------------------

gulp.task( 'clean:release', function () {
    return del( options.clean.release.files, function ( err, deletedFiles ) {
        notify( options.clean.release.message, 'crazy' );
    });
});

// -------------------------------------
//   Task: CSS
// -------------------------------------

gulp.task( 'css', function () {
    notify( options.css.message, 'writing' );
    return gulp.src( options.css.files )
        .pipe( plugins.plumber( function(error) {
            notify( error.message, 'fuck' );
            this.emit( 'end' );
        }))
        .pipe( plugins.sourcemaps.init() )
        .pipe( plugins.sass( options.css.scss_args ))
        .pipe( plugins.combineMq( options.css.combineMq_args ))
        .pipe( plugins.replace(/\{\*timestamp\*\}/g, opts.timestamp) )
        .pipe( plugins.pixrem() )
        .pipe( plugins.autoprefixer( options.css.autoprefixer_args ))
        .pipe( plugins.sourcemaps.write( '.', options.css.sourcemaps_args ))
        .pipe( gulp.dest( options.css.destination ))
        .pipe( plugins.minifyCss( options.css.minifyCss_args ))
        .pipe( plugins.rename({ suffix : '.min' }) )
        .pipe( plugins.csso() )
        .pipe( plugins.checkFilesize({ fileSizeLimit : 50000 }) )
        .pipe( gulp.dest( options.css.destination ) )
        .pipe( browserSync.reload({ stream:true }) );
});

// -------------------------------------
//   Task: Concat: Json
// -------------------------------------

gulp.task( 'concat:json', function() {
    return gulp.src( options.concat.json.files )
        .pipe( plugins.plumber({ errorHandler: throwError }) )
        .pipe( plugins.concat( options.concat.json.file ))
        .pipe( gulp.dest(  options.concat.json.destination  ))
        .pipe( plugins.yaml() )
        .pipe( gulp.dest(  options.concat.json.destination  ));
});

// -------------------------------------
//   Task: Concat: Scripts
// -------------------------------------

gulp.task( 'concat:scripts', function() {
    return gulp.src( options.concat.scripts.files )
    .pipe( plugins.uglify() )
    .pipe( plugins.plumber(function(error) {
        notify(error.message, 'fuck');
        this.emit('end');
    }))
    .pipe( plugins.concat( options.concat.scripts.file, { newLine: ';' } ))
    .pipe( plugins.checkFilesize({ fileSizeLimit : 50000 }))
    .pipe( gulp.dest( options.concat.scripts.destination ));
});

// -------------------------------------
//   Task: Concat: Polyfills
// -------------------------------------

gulp.task( 'concat:polyfills', function() {
    return gulp.src( options.concat.polyfills.files )
    .pipe( plugins.uglify() )
    .pipe( plugins.concat(options.concat.polyfills.file, { newLine: ';' }) )
    .pipe( plugins.checkFilesize({ fileSizeLimit : 50000 }) )
    .pipe( gulp.dest( options.concat.polyfills.destination ) );
});

// -------------------------------------
//   Task: Copy: Javascripts
// -------------------------------------

gulp.task( 'copy:javascripts', function () {
    return gulp.src( options.copy.javascripts.files )
        .pipe( gulp.dest( options.copy.javascripts.destination ));
});

// -------------------------------------
//   Task: Copy: Fonts
// -------------------------------------

gulp.task( 'copy:fonts', function () {
    return gulp.src( options.copy.fonts.files )
        .pipe( gulp.dest( options.copy.fonts.destination ));
});

// -------------------------------------
//   Task: Database
// -------------------------------------

gulp.task( 'database', function() {
    var result = exec( options.database.google_api, function( error, stdout, stderr ) {
        var json_google = JSON.parse(stdout),
            access_token = json_google.access_token,
            command = 'gsjson '+ opts.google_spreadsheet_id +' '+ routes.src.data +'/products.json -t '+ access_token +' -b -c id';

        exec(command, function( error, stdout, stderr ) {
            if (error !== null)
                notify('exec error: '+ error, 'fuck');
        });
    });
});

// -------------------------------------
//   Task: Default
// -------------------------------------

gulp.task( 'default', options.default.tasks );

// -------------------------------------
//   Task: Email
// -------------------------------------

gulp.task( 'email', function () {
    for (var i = 0; i < opts.landings.length; i++) {
        notify( options.email.message + opts.landings[i], 'start' );
        sendReleaseEmail( opts.landings[i] );
    }
});

// -------------------------------------
//   Task: Icons
// -------------------------------------

gulp.task('icons', function() {
    opts.icons = [];
    glob( options.icons.files, {mark:true}, function (er, matches) {
        var icon_name = '';
        for ( var i = 0; i < matches.length; i++ ) {
            icon_name = matches[i].replace( options.icons.match_pattern, '' );
            icon_name = icon_name.replace( '.svg', '' );
            opts.icons.push( icon_name );
        };
    });
});

// -------------------------------------
//   Task: Imagemin
// -------------------------------------

gulp.task('imagemin', function() {
    return gulp.src( options.imagemin.files )
        .pipe( plugins.imagemin() )
        .pipe( svgo({
            plugins: [
                { removeViewBox : false },
                { removeEmptyAttrs : false },
                { removeComments : true },
                { removeTitle : true }
            ]
        })())
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

gulp.task('markup', options.markup.tasks, function () {
    if (!fs.existsSync( options.markup.data )) {
        throwError();
        return true;
    }
    parseJsonFiles();

    var args = {
        data: {
            data: opts.json_data,
            products: opts.json_products,
            icons: opts.icons
        },
        cache: false,
        functions: twig_options.functions,
        filters: twig_options.filters
    };

    return gulp.src( options.markup.files )
        .pipe( plugins.twig( args ))
        .pipe( plugins.replace( /\{\*timestamp\*\}/g, opts.timestamp ))
        .pipe( plugins.minifyHtml( options.markup.minify ))
        .pipe( plugins.checkFilesize({ fileSizeLimit : 50000 }))
        .pipe( gulp.dest( options.markup.destination ))
        .pipe( browserSync.reload( { stream : true } ));
});

// -------------------------------------
//   Task: Markup: Generate
// -------------------------------------

gulp.task('markup:generate', function() {
    Object.keys( opts.json_products ).forEach(function(key) {
       generateMarkup( key );
    });
});

// -------------------------------------
//   Task: Publish
// -------------------------------------

gulp.task( 'publish', options.publish.tasks, function( callback ) {
    var message = options.publish.message.replace(/%s/g, opts.pageSlug),
        destination = options.publish.destination.replace(/%s/g, opts.pageSlug);

    notify( message, 'yeah' );
    return gulp.src( options.publish.globs, options.publish.args )
        .pipe( conn.newer( destination ))
        .pipe( conn.dest( destination ));
});

// -------------------------------------
//   Task: Publish: Set
// -------------------------------------

gulp.task( 'publish:set', function() {
    isPublish = true;
    conn = ftp.create( options.publish.ftp );
});

// -------------------------------------
//   Task: Publish: Build
// -------------------------------------

gulp.task( 'publish:build', function( callback ) {
    var tasks = options.publish.build.tasks;
    tasks.push(callback);
    runSequence.apply( null, tasks );
});

// -------------------------------------
//   Task: Release
// -------------------------------------

gulp.task( 'release', function( callback ) {
    isRelease = true;
    var tasks = options.release.tasks;
    tasks.push(callback);
    runSequence.apply(null, tasks);
});

// -------------------------------------
//   Task: Release: ZIP
// -------------------------------------

gulp.task('release:zip', function () {
    for (var i = 0; i < opts.landings.length; i++) {
        renameIndexFile( opts.landings[i] );
    }
});

// -------------------------------------
//   Task: SVG Sprites
// -------------------------------------

gulp.task( 'svg-sprite', options.svg.tasks, function() {
    gulp.src( options.svg.files )
        .pipe( plugins.csso() )
        .pipe( plugins.rename({ suffix:'.min' }))
        .pipe( plugins.checkFilesize({ fileSizeLimit : 50000 }))
        .pipe( gulp.dest( options.svg.destination ))
});

// -------------------------------------
//   Task: Watch
// -------------------------------------

gulp.task( 'watch', options.watch.tasks, function() {
    var watchFiles = options.watch.files();
    watchFiles.forEach( function( files, index ) {
        gulp.watch( files, options.watch.run()[ index ] );
    });
});
