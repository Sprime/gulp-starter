/*
 * @title Webpack Config
 */

// Dependencies
const path = require('path');
const webpack = require('webpack');

//Config
const config = require('./gulpConfig');

// Plugins
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  mode: process.env.NODE_ENV,

  entry: {
    main: config.scripts.src
  },

  output: {
    filename: '[name].js',
    chunkFilename: '[name].js'
  },

  optimization: {
    splitChunks: {
      chunks: 'initial',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          enforce: true
        }
      }
    }
  },

  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new WebpackNotifierPlugin({
      skipFirstNotification: true
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ],

  resolve: {
    alias: {
      block: path.resolve(`./src/blocks`),
      components: path.resolve(`./src/js/components`),
      utils: path.resolve(`./src/js/utils`)
    }
  }
};

if (process.env.NODE_ENV === 'production') {
  console.log('WEBPACK: production');
  // webpackConfig.devtool = 'source-map';
}
if (process.env.NODE_ENV === 'development') {
  console.log('WEBPACK: development');
  // webpackConfig.mode = 'development';
}
