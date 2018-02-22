"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");             // отслеживает ошибки в Gulp
var sourcemaps = require("gulp-sourcemaps");       // содержит информации об исходных файлах
var sass = require("gulp-sass");                   // компилирует SASS в CSS
var posthtml = require("gulp-posthtml");           // подключает плагины
var include = require("posthtml-include");         // вставляет спрайты в html файлы
var postcss = require("gulp-postcss");             // подключает плагины
var autoprefixer = require("autoprefixer");        // подставляет вендорные префиксы в CSS
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
var debug = require("gulp-debug");                 // показывает поток сборки в консоли
var newer = require("gulp-newer");                 // сравнивает файлы, являются ли они новыми (обновленными)
var wait = require("gulp-wait");                   // вставляет задержку перед вызовом следующего таска
var del = require("del");                          // удаляет папки, файлы
var size = require('gulp-size');                   // показывает размеры файлов
var run = require("run-sequence");                 // выполняет последовательность задач Gulp в указанном порядке
var server = require("browser-sync").create();     // запускает локальный сервер
var ghPages = require('gulp-gh-pages');            // публикация содержимого build на GH Pages

// Копирует файлы
gulp.task("copy", function() {
  console.log("---------- Копирую файлы");
  return gulp.src([
      "source/fonts/**/*.{woff,woff2}",
      "source/img/favicons/*.*"
    ], {
      base: "source"
  })
    .pipe(newer("build"))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    // .pipe(debug({title: "copy: "}))
    .pipe(gulp.dest("build"));
});

// Удаляет папку build и все ее содержимое
gulp.task("clean", function() {
  console.log("---------- Удаляю текущую сборку");
  return del("build");
});

// Готовит CSS для build версии
gulp.task("style", function() {
  console.log("---------- Компилирую SASS в CSS");
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(wait(50))
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest("build/css"))
    .pipe(gulp.dest("build/css"))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

// Проверяет, объединяет, минифицирует JS для build версии
gulp.task("scripts", function() {
  console.log("---------- Проверяю, объединяю и минифицирую JS");
  return gulp.src("source/js/*.js")
    .pipe(plumber())
    .pipe(newer("build/js"))
    .pipe(debug({title: "check js: "}))
    .pipe(jshint())
    .pipe(jshint.reporter("default"))
    .pipe(jshint.reporter("fail"))
    .pipe(concat("scripts.js"))
    .pipe(debug({title: "concat js: "}))
    .pipe(uglify())
    .pipe(rename("scripts.min.js"))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/js"))
    .pipe(debug({title: "minify js: "}));
});

// Копирует полифилы в build версию
gulp.task("polyfill", function () {
  console.log("---------- Копирую полифилы");
  return gulp.src([
    "node_modules/svg4everybody/dist/svg4everybody.min.js",
    "node_modules/picturefill/dist/picturefill.min.js"
  ])
    .pipe(debug({title: "copy polyfill: "}))
    .pipe(gulp.dest("build/js/lib"));
});

// Оптимизирует изображения
gulp.task("images", function() {
  console.log("---------- Оптимизирую изображения");
  return gulp.src("source/img/*.{png,jpg,svg}")
    .pipe(newer("build/img"))
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/img"))
});

// Копирует контентные изображения и конвертирует в формат webP в build версии
gulp.task("webp", function() {
  console.log("---------- Копирую, оптимизирую контентные изображения, конвертирую в формат webP");
  return gulp.src("source/img/content-image/*.{png,jpg}")
    .pipe(newer('build/img'))
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest("build/img/"))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(webp({quality: 90}))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/img/"))
});

// Собирает SVG спрайт в build версии
gulp.task("sprite", function() {
  console.log("---------- Собираю SVG-спрайт");
  return gulp.src("source/img/icons-for-sprite/**")
    .pipe(debug({title: "include in sprite: "}))
    .pipe(svgmin({
      plugins: [{
        removeAttrs: {
          attrs: "fill"
        }
      }]
    }))
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/img"))
    .pipe(debug({title: "copy svg-sprite: "}));
});

// Вставляет спрайт и минифицирует HTML файлы в папке build
gulp.task("html", function() {
  console.log("---------- Вставляю SVG спрайт и минифицирую HTML");
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(debug({title: "include svg-sprite: "}))
    .pipe(gulp.dest("build"))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest("build"))
    .pipe(debug({title: "minify HTML: "}))
    .pipe(server.stream());
});

// Запускает локальный сервер для build версии
gulp.task("serve", function() {
  console.log("---------- Запускаю локальный сервер");
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", ["style"]);
  gulp.watch("source/*.html", ["html"]);
  gulp.watch("source/img/*.{png,jpg,svg}", ["watch:images"]);
  gulp.watch("source/img/content-image/*.{png,jpg}", ["watch:webp"]);
  gulp.watch("source/img/icons-for-sprite/*.svg", ["watch:sprite"]);
});

// Следит за папкой с изображениями
gulp.task("watch:images", ["images"], function (done) {
  server.reload();
  done();
});

// Следит за папкой с контентными изображениями
gulp.task("watch:webp", ["webp"], function (done) {
  server.reload();
  done();
});

// Следит за папкой с иконками для спрайта
gulp.task("watch:sprite", ["sprite"], function (done) {
  server.reload();
  done();
});

// Запускает сборку build версии
gulp.task("build", function(done) {
  run(
    "clean",
    "copy",
    "style",
    "scripts",
    "polyfill",
    "images",
    "webp",
    "sprite",
    "html",
    done
  );
});


// Отправка в GH pages (ветку gh-pages репозитория)
gulp.task('deploy', function() {
  console.log('---------- Публикация содержимого ./build/ на GH pages');
  return gulp.src("./build/**/*")
    .pipe(ghPages());
});


// Готовит CSS для develop версии
gulp.task("style:develop", function() {
  gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("source/css"))
    .pipe(server.stream());
});

// Копирует контентные изображения и конвертирует в формат webP в develop версии
gulp.task("webp:develop", function() {
  return gulp.src("source/img/content-image/*.{png,jpg}")
    .pipe(gulp.dest("source/img/"))
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("source/img/"));
});

// Запускает локальный сервер для develop версии
gulp.task("serve:develop", function() {
  server.init({
    server: "source/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", ["style:develop"]);
  gulp.watch("source/*.html").on("change", server.reload);
});

// Запускает develop версию для разработки
gulp.task("develop", function(done) {
  run(
    "style:develop",
    //"webp:develop",
    "serve:develop",
    done
  );
});
