"use strict";

var gulp = require("gulp");
var webp = require("gulp-webp");


gulp.task("webp", function() {
  return gulp.src("source/img/**/*.{png,jpg}")
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("source/img/"));
});
