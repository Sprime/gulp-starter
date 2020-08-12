let config = {
  src: './src',
  build: './build',
  blocks: './src/blocks',
  styles: {
    src: './src/styles/styles.scss',
    blocks: './src/blocks/**/*.scss',
    watch: './src/styles/**/*.scss',
    dest: './build/css'
  },
  templates: {
    src: './src/templates/*.html',
    blocks: './src/blocks/**/*.html',
    watch: './src/templates/**/*.html',
    dest: './build'
  },
  scripts: {
    src: './src/scripts/index.js',
    blocks: './src/blocks/**/*.js',
    watch: './src/scripts/**/*.js',
    dest: './build/js'
  },
  images: {
    src: './src/images/content/**/*.{jpg,jpeg,png,gif,tiff,svg}',
    webp: './src/images/content/**/*.{jpg,jpeg,png,tiff}',
    watch: './src/images/content/**/*',
    dest: './build/images',
    temp: {
      src: './src/images/temp/**/*',
      watch: './src/images/temp/**/*',
      dest: './build/temp'
    }
  },
  sprites: {
    svg: {
      src: 'src/images/sprites/svg/*.svg',
      watch: 'src/images/sprites/svg/*.svg'
    },
    png: {
      src: 'src/images/sprites/png/*.png',
      watch: 'src/images/sprites/png/*.png'
    },
    dest: './build/images'
  },
  fonts: {
    src: './src/fonts/*.{ttf,otf,eot,woff,woff2,svg}',
    watch: './src/fonts/*.{ttf,otf,eot,woff,woff2,svg}',
    dest: './build/fonts'
  },
  static: {
    src: [
      './src/static/**/*.*',
      './src/static/**/.htaccess'
    ],
    watch: './src/static/**/*.*',
    dest: './build'
  }
};

module.exports = config;
