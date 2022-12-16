const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  stats: 'verbose',
  mode: 'development',
  entry: './client.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
  },
  devtool: 'inline-source-map',
  devServer: {
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
  ],
}