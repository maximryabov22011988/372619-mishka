"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");             // отслеживает ошибки в Gulp
var sourcemaps = require("gulp-sourcemaps");       // содержит информации об исходных файлах
var sass = require("gulp-sass");                   // компилирует SASS в CSS
var postcss = require("gulp-postcss");             // подключает плагины
var autoprefixer = require("autoprefixer");        // подставляет вендорные префиксы в CSS
var mqpacker = require("css-mqpacker");            // объединяет медиа-запросы
var htmlmin = require("gulp-htmlmin");             // минифицирует HTML
var minify = require("gulp-csso");                 // минифицирует CSS
var jshint = require("gulp-jshint");               // проверяет JS
var concat = require("gulp-concat");               // объединяет файлы в один файл
var uglify = require("gulp-uglify");               // минифицирует JS
var imagemin = require("gulp-imagemin");           // оптимизирует изображения
var webp = require("gulp-webp");                   // конвертирует jpg, png изображения в webP
var svgstore = require("gulp-svgstore");           // создаёт SVG спрайт
var svgmin = require("gulp-svgmin");               // минифицирует SVG файлы
var rename = require("gulp-rename");               // переименовывает файлы
var del = require("del");                          // удаляет папки, файлы
var run = require("run-sequence");                 // выполняет последовательность задач Gulp в указанном порядке
var server = require("browser-sync").create();     // запускает локальный сервер


/* Минифицирует HTML файлы в папке build*/

gulp.task("html", function() {
  return gulp.src("build/*.html")
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest("build"));
});


/* Готовит CSS для build версии */

gulp.task("style", function() {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({browsers: [
        "last 2 versions"
      ]}),
      mqpacker({
        sort: true
      })
    ]))
    .pipe(gulp.dest("build/css"))
    .pipe(minify())
    .pipe(rename("min.style.css"))
    .pipe(gulp.dest("build/css"));
});


/* Проверяет, объединяет, минифицирует JS для build версии */

gulp.task("scripts", function() {
  return gulp.src("source/js/*.js")
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter("default"))
    .pipe(jshint.reporter("fail"))
    .pipe(concat("scripts.js"))
    .pipe(uglify())
    .pipe(rename("min.scripts.js"))
    .pipe(gulp.dest("build/js"));
});


/* Оптимизирует изображения */

gulp.task("images", function() {
  return gulp.src("build/img/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
});


/* Конвертирует контентные изображения в формат webP */

gulp.task("webp", function() {
  return gulp.src("build/img/**/*.{png,jpg}")
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img/"));
});


/* Собирает SVG спрайт */

gulp.task("sprite", function() {
  return gulp.src("source/img/icons-for-sprite/**")
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});


/* Запускает локальный сервер */

gulp.task("serve", function() {
  server.init({
    server: "build/"
  });

  gulp.watch("source/sass/**/*.{scss,sass}", ["style"]);
});


/* Копирует файлы */

gulp.task("copy", function() {
  return gulp.src([
      "source/fonts/**/*.{woff,woff2}",
      "source/img/*.*",
      "source/img/favicons/*.*",
      "source/js/lib/*.js",
      "source/*.html"
    ], {
      base: "source"
  })
    .pipe(gulp.dest("build"));
});


/* Удаляет папку build и все ее содержимое */

gulp.task("clean", function() {
  return del("build");
});


/* Запускает построение build версии сайта */

gulp.task("build", function(done) {
  run(
    "clean",
    "copy",
    "html",
    "style",
    "scripts",
    "images",
    "webp",
    "sprite",
    "serve",
    done
  );
});
