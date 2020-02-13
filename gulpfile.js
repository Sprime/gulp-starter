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
const imagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminZopfli = require('imagemin-zopfli');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGiflossy = require('imagemin-giflossy');
const imageminWebp = require('imagemin-webp');
const webp = require('gulp-webp');
const svg = require('gulp-svg-sprite');
const spritesmith = require('gulp.spritesmith');
const buffer = require('vinyl-buffer');
const merge = require('merge-stream');

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
    .pipe(browserSync.stream());
}
exports.scss = scss;

function writeScssBlocks(cb) {
  const newScssList = [];
  let allBlocksWithScssFiles = getDirectories('scss');
  allBlocksWithScssFiles.forEach(function(blockWithScssFile) {
    let url = `${blockWithScssFile}/${blockWithScssFile}`;
    if (newScssList.indexOf(url) > -1) return;
    newScssList.push(url);
  });
  if (newScssList.length) {
    let styleImports = '';
    newScssList.forEach(function(src) {
      styleImports += `@import '${src}';\n`;
    });
    fs.writeFileSync(config.src + '/styles/_blocks.scss', styleImports);
    console.log('---------- Write blocks scss file');
  }
  cb();
}
exports.writeScssBlocks = writeScssBlocks;

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
    .pipe(dest(config.templates.dest));
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
    .pipe(dest(config.scripts.dest));
}
exports.scripts = scripts;

function esLint() {
  return src(config.scripts.src)
    .pipe(gulpEslint())
    .pipe(gulpEslint.format())
    .pipe(gulpEslint.failAfterError())
}
exports.esLint = esLint;


// Изображения
function imgContent() {
  return src(config.images.src)
    .pipe(gulpIf(isProd, imagemin([
      imageminGiflossy({
        optimizationLevel: 3,
        optimize: 3,
        lossy: 2
      }),
      imageminPngquant({
        speed: 5,
        quality: [0.6, 0.8]
      }),
      imageminZopfli({
        more: true
      }),
      imageminMozjpeg({
        progressive: true,
        quality: 90
      }),
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {removeUnusedNS: false},
          {removeUselessStrokeAndFill: false},
          {cleanupIDs: false},
          {removeComments: true},
          {removeEmptyAttrs: true},
          {removeEmptyText: true},
          {collapseGroups: true}
        ]
      })
    ])))
    .pipe(dest(config.images.dest));
}
exports.imgContent = imgContent;

function imgWebp() {
  return src(config.images.webp)
    .pipe(webp(gulpIf(isProd, imageminWebp({
      lossless: true,
      quality: 100,
      alphaQuality: 100
    }))))
    .pipe(dest(config.images.dest));
}
exports.imgWebp = imgWebp;

function imgTemp() {
  return src(config.images.temp.src)
    .pipe(gulpIf(isProd, imagemin([
      imageminGiflossy({
        optimizationLevel: 3,
        optimize: 3,
        lossy: 2
      }),
      imageminPngquant({
        speed: 5,
        quality: [0.6, 0.8]
      }),
      imageminZopfli({
        more: true
      }),
      imageminMozjpeg({
        progressive: true,
        quality: 90
      }),
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {removeUnusedNS: false},
          {removeUselessStrokeAndFill: false},
          {cleanupIDs: false},
          {removeComments: true},
          {removeEmptyAttrs: true},
          {removeEmptyText: true},
          {collapseGroups: true}
        ]
      })
    ])))
    .pipe(dest(config.images.temp.dest));
}
exports.imgTemp = imgTemp;


// Спрайты изображений
function spriteSVG() {
  return src(config.sprites.svg.src)
    .pipe(svg({
      mode: {
        stack: {
          sprite: '../sprite.svg'
        }
      }
    }))
    .pipe(dest(config.sprites.dest));
}
exports.spriteSVG = spriteSVG;

function spritePNG() {
  let spriteData = src(config.sprites.png.src)
    .pipe(spritesmith({
      imgName: 'sprite.png',
      cssName: '_sprite.scss',
      padding: 5,
      imgPath: '/images/' + 'sprite.png'
    }));

  let imgStream = spriteData.img
    .pipe(buffer())
    .pipe(gulpIf(isProd, imagemin([
      imageminPngquant({
        speed: 5,
        quality: [0.6, 0.8]
      })
    ])))
    .pipe(dest(config.sprites.dest));

  let cssStream = spriteData.css
    .pipe(dest(config.src + '/styles/base/'));
  return merge(imgStream, cssStream);
}
exports.spritePNG = spritePNG;


// Копирование папок: favicon, static, fonts
function copyStatic() {
  return src(config.static.src)
    .pipe(dest(config.static.dest));
}
exports.copyStatic = copyStatic;

function copyFavicon() {
  return src(config.src + '/favicon/**/*')
    .pipe(dest(config.build + '/favicon'));
}
exports.copyFavicon = copyFavicon;

function copyFonts() {
  return src(config.fonts.src)
    .pipe(dest(config.fonts.dest));
}
exports.copyFonts = copyFonts;


function reload(done) {
  browserSync.reload();
  done();
}

function serve() {

  browserSync.init({
    server: config.build,
    notify: true,
    open: false
  });

  watch([config.templates.watch, config.templates.blocks], series(
    templates,
    reload
  ));

  watch(config.styles.blocks, { events: ['add', 'unlink'], delay: 100 }, writeScssBlocks);
  watch(config.styles.blocks, { events: ['change'], delay: 100 }, scss);
  watch(config.styles.watch, scss);

  watch([config.scripts.watch, config.scripts.blocks], series(
    scripts,
    reload
  ));

  watch(config.images.watch, series(parallel(imgContent, imgWebp), reload));

  watch(config.images.temp.watch, series(imgTemp, reload));

  watch(config.sprites.svg.watch, series(spriteSVG, reload));

  watch(config.sprites.png.watch, series(spritePNG, reload));

  watch(config.fonts.watch, series(copyFonts, reload));

  watch(config.static.watch, series(copyStatic, reload));

  watch(config.src + '/favicon/**/*', series(copyFavicon, reload));

}


exports.default = series(
  clean,
  parallel(templates, writeScssBlocks),
  parallel(imgContent, imgWebp, imgTemp, spriteSVG, spritePNG),
  parallel(copyStatic, copyFavicon, copyFonts),
  parallel(scss, scripts),
  serve
);

exports.build = series(
  clean,
  parallel(templates, writeScssBlocks),
  parallel(imgContent, imgWebp, imgTemp, spriteSVG, spritePNG),
  parallel(copyStatic, copyFavicon, copyFonts),
  parallel(scss, scripts)
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
  let source = config.blocks + '/';
  return fs.readdirSync(source)
    .filter(item => fs.lstatSync(source + item).isDirectory())
    .filter(item => fileExist(source + item + '/' + item + '.' + ext));
}
