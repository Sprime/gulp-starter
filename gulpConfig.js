/* global module */

let config = {
  src: './src',
  build: './build',
  blocks: './blocks',
  styles: {
    src: './src/styles/styles.scss',
    watch: './src/styles/**/*.scss',
    blocks: './src/blocks/**/*.scss',
    dest: './build/css'
  },
  templates: {
    src: './src/templates/*.html',
    watch: './src/templates/**/*.html',
    blocks: './src/blocks/**/*.html',
    dest: './build'
  }
};

module.exports = config;
