"use strict";

var gulp = require("gulp");
var extend      = require("extend");
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
var gulpIf = require("gulp-if");                   // задает условия при выполнении потока
var debug = require("gulp-debug");                 // показывает поток сборки в консоли
var newer = require("gulp-newer");                 // сравнивает файлы, являются ли они новыми (обновленными)
var wait = require("gulp-wait");                   // вставляет задержку перед вызовом следующего таска
var del = require("del");                          // удаляет папки, файлы
var size = require("gulp-size");                   // показывает размеры файлов
var run = require("run-sequence");                 // выполняет последовательность задач Gulp в указанном порядке
var server = require("browser-sync").create();     // запускает локальный сервер
var ghPages = require("gulp-gh-pages");            // публикация содержимого build на GH Pages


// Определение: разработка это или финальная сборка
// Запуск `NODE_ENV=production npm start [задача]` приведет к сборке без sourcemaps
var isDev = !process.env.NODE_ENV || process.env.NODE_ENV == "dev";

// Удаляет папку build и все ее содержимое
gulp.task("clean", function() {
  console.log("---------- Удаляю текущую сборку");
  return del("build");
});

// Копирует шрифты
gulp.task("copy:fonts", function () {
  console.log("---------- Копирую шрифты");
  return gulp.src("source/fonts/*.{ttf,woff,woff2,eot,svg}")
    .pipe(newer("build/fonts/"))  // оставить в потоке только изменившиеся файлы
    .pipe(size({
      title: "Размер",
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/fonts/"));
});

// Копирует фавиконки
gulp.task("copy:favicon", function () {
  console.log("---------- Копирую фавиконки");
  return gulp.src("source/img/favicons/*.{png,ico,svg}")
    .pipe(gulp.dest("build/img/favicons"));
});
gulp.task("copy:favicon:data", function () {
  return gulp.src("source/img/favicons/*.{xml,json}")
    .pipe(gulp.dest("build/img/favicons"));
});

// Копирует normalize в папку source
gulp.task("copy:normalize", function () {
  console.log("---------- Компилирую normalize.scss");
  return gulp.src([
    "node_modules/normalize.css/normalize.css"
  ])
    .pipe(rename("normalize.scss"))
    .pipe(newer("source/sass/global"))  // оставить в потоке только изменившиеся файлы
    .pipe(gulp.dest("source/sass/global/"));
});

// Копирует полифилы в папку build
gulp.task("copy:polyfill", function () {
  console.log("---------- Копирую полифилы");
  return gulp.src([
    "node_modules/svg4everybody/dist/svg4everybody.min.js",
    "node_modules/picturefill/dist/picturefill.min.js"
  ])
    .pipe(newer("build/js/lib"))  // оставить в потоке только изменившиеся файлы
    .pipe(gulp.dest("build/js/lib"));
});

// Компилирует стили
// Запуск `NODE_ENV=production npm start style` приведет к сборке без sourcemaps
gulp.task("style", function() {
  console.log("---------- Компилирую стили");
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(wait(100))
    .pipe(gulpIf(isDev, sourcemaps.init()))
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulpIf(!isDev, minify()))
    .pipe(rename("style.min.css"))
    .pipe(gulpIf(isDev, sourcemaps.write("/")))
    .pipe(size({
      title: "Размер",
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

// Проверяет, объединяет, минифицирует JS
// Запуск `NODE_ENV=production npm start scripts` приведет к сборке без sourcemaps
gulp.task("scripts", function() {
  console.log("---------- Проверяю, объединяю и минифицирую JS");
  return gulp.src("source/js/*.js")
    .pipe(plumber())
    .pipe(gulpIf(isDev, sourcemaps.init()))
    .pipe(newer("build/js"))  // оставить в потоке только изменившиеся файлы
    .pipe(debug({title: "check js: "}))
    .pipe(jshint())
    .pipe(jshint.reporter("default"))
    .pipe(jshint.reporter("fail"))
    .pipe(concat("scripts.min.js"))
    .pipe(gulpIf(!isDev, uglify()))
    .pipe(gulpIf(isDev, sourcemaps.write("/")))
    .pipe(size({
      title: "Размер",
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/js"))
    .pipe(debug({title: "copy js: "}));
});

// Оптимизирует изображения
// Запуск `NODE_ENV=production npm start images` приведет к оптимизации изображений
gulp.task("images", function() {
  console.log("---------- Копирую и оптимизирую изображения");
  return gulp.src("source/img/*.{png,jpg,svg}")
    .pipe(newer("build/img"))  // оставить в потоке только изменившиеся файлы
    .pipe(gulpIf(!isDev, imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ])))
    .pipe(size({
      title: "Размер",
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/img"))
});

// Копирует, оптимизирует и конвертирует в формат webP контентные изображения в папке build
// Запуск `NODE_ENV=production npm start webp` приведет к оптимизации контентных изображений и созданию копий в формате webP
gulp.task("webp", function() {
  console.log("---------- Копирую, оптимизирую, конвертирую в формат webP контентные изображения");
  return gulp.src("source/img/content-image/*.{png,jpg}")
    .pipe(newer("build/img"))  // оставить в потоке только изменившиеся файлы
    .pipe(gulpIf(!isDev, imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ])))
    .pipe(gulp.dest("build/img/"))
    .pipe(size({
      title: "Размер",
      showFiles: true,
      showTotal: false,
    }))
    .pipe(webp({quality: 90}))
    .pipe(size({
      title: "Размер",
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/img/"))
});

// Собирает SVG спрайт
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
      title: "Размер",
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest("build/img"))
    .pipe(debug({title: "copy svg-sprite: "}));
});

// Вставляет спрайт и минифицирует HTML файлы в папке build
// Запуск `NODE_ENV=production npm start html` приведет к вставке SVG спрайта и минификации HTML
gulp.task("html", function() {
  console.log("---------- Вставляю SVG спрайт и минифицирую HTML");
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(debug({title: "include svg-sprite: "}))
    .pipe(gulp.dest("build"))
    .pipe(gulpIf(!isDev, htmlmin({collapseWhitespace: true})))
    .pipe(gulp.dest("build"))
    .pipe(debug({title: "minify HTML: "}))
    .pipe(server.stream());
});

// Запускает локальный сервер
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
    "copy:fonts",
    "copy:favicon",
    "copy:favicon:data",
    "copy:normalize",
    "copy:polyfill",
    "style",
    "scripts",
    "images",
    "webp",
    "sprite",
    "html",
    done
  );
});


// Отправка в GH-Pages (ветку gh-pages репозитория)
gulp.task("deploy", function() {
  console.log("---------- Публикация содержимого папки build на GH-Pages");
  return gulp.src("./build/**/*")
    .pipe(ghPages({
      "remoteUrl" : "git@github.com:maximryabov22011988/372619-mishka.git"
    }));
});
