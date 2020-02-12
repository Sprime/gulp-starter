/* global exports process console __dirname Buffer */
/* eslint-disable no-console */
'use strict';

// Пакеты, использующиеся при обработке
const {src, dest, watch, series, parallel} = require('gulp');
const fs = require('fs');
const del = require('del');
const browserSync = require('browser-sync').create();
const gulpIf = require('gulp-if');
const debug = require('gulp-debug');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cssbeautify = require('gulp-cssbeautify');
const mincss = require('gulp-clean-css');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const atImport = require('postcss-import');
const inlineSVG = require('postcss-inline-svg');
const objectFitImages = require('postcss-object-fit-images');
const gulpStylelint = require('gulp-stylelint');
const prettyhtml = require('gulp-pretty-html');
const nunjucksRender = require('gulp-nunjucks-render');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');
const gulpEslint = require('gulp-eslint');

// Глобальные настройки этого запуска
const config = require('./gulpConfig');
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

// Настройки бьютификатора
let prettyOption = {
  indent_size: 2,
  indent_char: ' ',
  unformatted: ['code', 'em', 'strong', 'span', 'i', 'b', 'br', 'script'],
  content_unformatted: [],
  max_preserve_newlines: 1,
  extra_liners: ''
};

// Список и настройки плагинов postCSS
let postCssPlugins = [
  autoprefixer({
    cascade: false,
    grid: true
  }),
  atImport(),
  inlineSVG(),
  objectFitImages(),
];

function clean() {
  return del([
    `${config.build}/**/*`
  ])
}
exports.clean = clean;


// Стили
function scss() {
  return src(config.styles.src)
    .pipe(gulpIf(isDev, sourcemaps.init({
      largeFile: true,
      loadMaps: true
    })))
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err.message);
        this.emit('end');
      }
    }))
    .pipe(sass({
      includePaths: [
        __dirname + '/',
        'node_modules',
        config.blocks
      ]
    }))
    .pipe(postcss(postCssPlugins))
    .pipe(gulpIf(isProd, mincss({
      compatibility: 'ie8', level: {
        1: {
          specialComments: 0,
          removeEmpty: true,
          removeWhitespace: true
        },
        2: {
          mergeMedia: true,
          removeEmpty: true,
          removeDuplicateFontRules: true,
          removeDuplicateMediaBlocks: true,
          removeDuplicateRules: true,
          removeUnusedAtRules: false
        }
      }
    })))
    .pipe(gulpIf(isDev, cssbeautify({
      indent: '  ',
      autosemicolon: true
    })))
    .pipe(gulpIf(isProd, rename({
      suffix: '.min'
    })))
    .pipe(plumber.stop())
    .pipe(gulpIf(isDev, sourcemaps.write()))
    .pipe(dest(config.styles.dest))
    .pipe(debug({
      title: 'SCSS:'
    }))
    .pipe(browserSync.stream());
}
exports.scss = scss;

function stylelint() {
  return src([config.styles.watch, config.styles.blocks])
    .pipe(gulpStylelint({
      failAfterError: true,
      reporters: [{formatter: 'string', console: true}],
      syntax: 'scss'
    }));
}
exports.stylelint = stylelint;


// Шаблоны
function templates() {
  return src(config.templates.src)
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err.message);
        this.emit('end');
      }
    }))
    .pipe(nunjucksRender({
      path: [
        `${config.src}/templates`,
        `${config.blocks}`
      ]
    }))
    .pipe(prettyhtml(prettyOption))
    .pipe(gulpIf(isProd, replace('.css', '.min.css')))
    .pipe(gulpIf(isProd, replace('.js', '.min.js')))
    .pipe(dest(config.templates.dest))
    .pipe(debug({
      title: 'HTML:'
    }));
}
exports.templates = templates;


// Скрипты
function scripts() {
  return src(config.scripts.src)
    .pipe(plumber())
    .pipe(gulpWebpack(require('./webpack.config'), webpack))
    .pipe(gulpIf(isProd, rename({
      suffix: '.min'
    })))
    .pipe(dest(config.scripts.dest))
    .pipe(debug({
      title: 'JS files:'
    }));
}
exports.scripts = scripts;

function esLint() {
  return src(config.scripts.src)
    .pipe(gulpEslint())
    .pipe(gulpEslint.format())
    .pipe(gulpEslint.failAfterError())
}
exports.esLint = esLint;


exports.default = series(
  parallel(clean),
  parallel(templates),
  parallel(scss, scripts)
);

exports.build = series(
  parallel(clean),
  parallel(templates),
  parallel(scss, stylelint, scripts, esLint)
);


/**
 * Проверка существования файла или папки
 * @param  {string} filepath Путь до файла или папки
 * @return {boolean}
 */
function fileExist(filepath) {
  let flag = true;
  try {
    fs.accessSync(filepath, fs.F_OK);
  } catch (e) {
    flag = false;
  }
  return flag;
}

/**
 * Получение всех названий поддиректорий, содержащих файл указанного расширения, совпадающий по имени с поддиректорией
 * @param  {string} ext    Расширение файлов, которое проверяется
 * @return {array}         Массив из имён блоков
 */
function getDirectories(ext) {
  let source = config.blocks;
  return fs.readdirSync(source)
    .filter(item => fs.lstatSync(source + item).isDirectory())
    .filter(item => fileExist(source + item + '/' + item + '.' + ext));
}
