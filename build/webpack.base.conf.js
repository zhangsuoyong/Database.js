var path = require('path')
var fs = require('fs')
var utils = require('./utils')
var config = require('../config')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  entry: {
    app: './demo/demo.js'
  },
  output: {
      path: __dirname,
      filename: "./demo/bundle.js"
  },
  resolve: {
    extensions: ['.js',  '.json'],
    alias: {
      '@': resolve('src'),
    },
    symlinks: false
  },
  module: {
    rules: [

      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test')]
      }
    ]
  }
}
