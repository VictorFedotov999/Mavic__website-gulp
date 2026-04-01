const gulp = require('gulp');
const clean = require('gulp-clean');
const rename = require('gulp-rename');
const path = require('path');

const htmlmin = require('gulp-htmlmin');
const fileInclude = require('gulp-file-include');
const sourceMaps = require('gulp-sourcemaps');

const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob');
const cleanCSS = require('gulp-clean-css')
const groupMedia = require('gulp-group-css-media-queries');

const terser = require('gulp-terser');
const concat = require('gulp-concat');

const server = require('gulp-server-livereload');
const fs = require('fs');

const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const changed = require('gulp-changed');

const through2 = require('through2');
const sharp = require('sharp');
const svgo = require('gulp-svgo');

const plumberNotify = (title) => {
    return {
        errorHandler: notify.onError({
            title: title,
            message: 'Error <%= error.message %>',
            sound: false,
        }),
    };
};

const fileIncludeSetting = {
    prefix: '@@',
    basepath: '@file',
};

gulp.task('clean', function (done) {
    if (fs.existsSync('./build/')) {
        return gulp
            .src('./build/', { read: false })
            .pipe(clean({ force: true }));
    }
    done();
});

gulp.task('html', function() {
    return gulp.src('./app/**/*.html')
    .pipe(plumber(plumberNotify('HTML')))
    .pipe(fileInclude(fileIncludeSetting))
    .pipe(htmlmin({
        collapseWhitespace: true, 
        removeComments: true,     
        removeRedundantAttributes: true, 
        useShortDoctype: true,    
        removeEmptyAttributes: true,
        minifyJS: true,           
        minifyCSS: true           
    }))
    .pipe(gulp.dest('./build'));
});

gulp.task('sass', function () {
    return gulp.src([
        
        './node_modules/fullpage.js/dist/fullpage.css', 
        './app/scss/*.scss'
    ])
    .pipe(changed('./build/css/'))
    .pipe(plumber(plumberNotify('SCSS')))
    .pipe(sourceMaps.init())
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(groupMedia()) 
    .pipe(cleanCSS({
        level: {
            1: {
                specialComments: 'none', 
                removeQuotes: true,     
                semicolonAfterLastProperty: true 
            },
            2: {
                mergeMedia: true,      
                removeUnusedAtRules: true, 
                restructureRules: false 
            }
        },
        compatibility: 'ie9',      
        format: false,              
        inline: ['none'],           
        rebase: true             
    }))
    .pipe(sourceMaps.write())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./build/css/'))
});

gulp.task('js', function() {
    return gulp.src([
        './node_modules/jquery/dist/jquery.js',
        
        './node_modules/fullpage.js/dist/fullpage.js',
        './node_modules/slick-carousel/slick/slick.js', 
        './app/js/**/*.js', 
        '!./app/js/**/*.min.js' 
    ])
    .pipe(plumber(plumberNotify('JS')))
    .pipe(changed('./build/js/'))
    .pipe(sourceMaps.init())
    .pipe(concat('main.min.js')) 
    .pipe(terser({
        format: {
            comments: false 
        }
    }))
    .pipe(sourceMaps.write('.'))
    .pipe(gulp.dest('./build/js/'))
});


gulp.task('images:raster', function() {
    return gulp.src('./app/img/**/*.{png,jpg,jpeg,webp}')
        .pipe(through2.obj(function(file, _, cb) {
            if (file.isNull()) return cb(null, file);
            const ext = path.extname(file.path).toLowerCase();
            const supportedFormats = ['.png', '.jpg', '.jpeg', '.webp'];
            if (!supportedFormats.includes(ext)) {
                return cb(null, file);
            }

            const outputOptions = {
                '.png': { quality: 80, compressionLevel: 6 },
                '.jpg': { quality: 85, mozjpeg: true },
                '.jpeg': { quality: 85, mozjpeg: true },
                '.webp': { quality: 85 }
            };

            fs.readFile(file.path, (err, data) => {
                if (err) {
                    console.error('⚠️ Ошибка чтения файла:', file.path);
                    return cb(null, file);
                }

                sharp(data)
                    .toFormat(ext.substring(1), outputOptions[ext] || {})
                    .toBuffer()
                    .then(outputBuffer => {
                        file.contents = outputBuffer;
                        cb(null, file);
                    })
                    .catch(err => {
                        console.error('⚠️ Ошибка сжатия:', file.path);
                        console.error(err.message);
                        cb(null, file);
                    });
            });
        }))
        .pipe(gulp.dest('./build/img/'));
});

gulp.task('images:vector', function() {
    return gulp.src('./app/img/**/*.svg')
        .pipe(svgo({
            plugins: [
                { name: 'removeViewBox', active: false }, 
                { name: 'removeDimensions', active: true }, 
                { name: 'cleanupIDs', active: false }, 
                { name: 'removeTitle', active: true }, 
                { name: 'removeDesc', active: true } 
            ]
        }))
        .pipe(gulp.dest('./build/img/'));
});

gulp.task('images', gulp.parallel('images:raster', 'images:vector'));

gulp.task('fonts', function () {
    return gulp
        .src('./app/fonts/**/*')
        .pipe(changed('./build/fonts/'))
        .pipe(gulp.dest('./build/fonts/'));
});

gulp.task('files', function () {
    return gulp
        .src('./app/files/**/*')
        .pipe(changed('./build/files/'))
        .pipe(gulp.dest('./build/files/'));
});

const serverOptions = {
    livereload: true,
    open: true,
};

gulp.task('server', function () {
    return gulp.src('./build/').pipe(server(serverOptions));
});

gulp.task('watch', function () {
    gulp.watch('./app/scss/**/*.scss', gulp.parallel('sass'));
    gulp.watch('./app/**/*.html', gulp.parallel('html'));
    gulp.watch('./app/js/**/*', gulp.parallel('js'));
    gulp.watch('./app/img/**/*', gulp.parallel('images'));
    gulp.watch('./app/fonts/**/*', gulp.parallel('fonts'));
    gulp.watch('./app/files/**/*', gulp.parallel('files'));
});

gulp.task(
    'default',
    gulp.series(
        'clean',
        gulp.parallel('html', 'sass', 'js', 'images', 'fonts', 'files'),
        gulp.parallel('server', 'watch')
    )
);