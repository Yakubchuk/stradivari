'use strict';

var gulp = require("gulp");
var imagemin = require("gulp-imagemin");
var imageminJpegRecompress = require('imagemin-jpeg-recompress');
var pngquant = require('imagemin-pngquant');
var cache = require('gulp-cache');
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var csso = require("gulp-csso");
var cssnano = require('gulp-cssnano');
var rename = require("gulp-rename");
var webp = require("gulp-webp");
var posthtml = require("gulp-posthtml");
var posthtmlInclude = require("posthtml-include");
var uglify = require("gulp-uglify");
var concat = require("gulp-concat");
var run = require("run-sequence");
var del = require("del");
var zip = require('gulp-zip');
var server = require("browser-sync").create();
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var reload = server.reload;

gulp.task("style", function() {
    gulp.src("src/scss/styles.scss")
        .pipe(plumber())
        .pipe(sass())
        .pipe(postcss([
            autoprefixer()
        ]))
        .pipe(gulp.dest("build/css"))
        // .pipe(csso({
        //     restructure: false,
        //     sourceMap: true,
        //     debug: true
        // }))
        .pipe(cssnano())
        .pipe(plumber.stop())
        .pipe(rename("style.min.css"))
        .pipe(gulp.dest("build/css"))
});
gulp.task("minify-images", function () {
    return gulp.src("src/img/**/*.{jpg,jpeg,png}")
        .pipe(cache(imagemin([
            imagemin.jpegtran({progressive: true}),
            imageminJpegRecompress({
                loops: 5,
                min: 65,
                max: 70,
                quality:'medium'
            }),
            imagemin.svgo(),
            imagemin.optipng({optimizationLevel: 3}),
            pngquant({quality: '65-70', speed: 5}),
        ],{
            verbose: true
        })))
        .pipe(webp({
            quality: 87
        }))
        .pipe(gulp.dest("src/img/webp"));
});
gulp.task("html", function () {
    return gulp.src("src/*.html")
        .pipe(plumber())
        .pipe(posthtml([
            posthtmlInclude()
        ]))
        .pipe(plumber.stop())
        .pipe(gulp.dest("build"));
});


gulp.task('es5', () =>
    gulp.src('src/js/es6/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(gulp.dest('src/js/es5'))
);


gulp.task("jsConcat", function () {
    return gulp.src("src/js/*.js")
        .pipe(plumber())
        .pipe(concat("script.js"))
        .pipe(gulp.dest("build/js"))
        .pipe(uglify())
        .pipe(plumber.stop())
        .pipe(rename("script.min.js"))
        .pipe(gulp.dest("build/js"));
});
gulp.task("copyjs", function () {
    return gulp.src("src/js/libs/**")
        .pipe(gulp.dest("build/js/libs"));
});
gulp.task("copy", function () {
    return gulp.src([
        "src/fonts/**/*.{woff,woff2}",
        "src/img/**",
    ], {
        base: "./src/"
    })
        .pipe(gulp.dest("build"));
});
gulp.task("clean", function () {
    return del("build","archive");
});
gulp.task("zip", function () {
    return gulp.src('build/**/*')
        .pipe(zip("archive.zip"))
        .pipe(gulp.dest("archive"))
});
gulp.task('clear', function (done) {
    return cache.clearAll(done);
});
gulp.task("build", function (done) {
    run(
        "clean",
        "jsConcat",
        "minify-images",
        'copy',
        'copyjs',
        "style",
        "html",
        "zip",
        done
    );
});

gulp.task("serve" , function() {
    server.init({
        server: "build/",
        notify: false,
        open: true,
        browser: "chrome",
        cors: true,
        ui: false
    });
    gulp.watch("src/scss/**/*.{scss,sass}", ["style"]);
    gulp.watch("src/js/**/*.js", ["jsConcat"]);
    gulp.watch("src/**/*.html", ["html"]);
    gulp.watch("build/**/*").on("change", reload);
});
