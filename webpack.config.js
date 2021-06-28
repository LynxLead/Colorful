// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    background: path.resolve(__dirname, 'public/app/background.js'),
    content: path.resolve(__dirname, 'public/app/content.js'),
  },
  devtool: 'cheap-module-source-map',
  output: {
    path: path.resolve(__dirname, 'build/app'),
    filename: '[name].js'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  }
}
