const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const projectDir = path.resolve(__dirname, './');

const TARGET = process.env.TARGET || 'electron-renderer';
const ENV = process.env.NODE_ENV || 'development';

module.exports = {
  entry: {
    app: path.join(projectDir, 'src/electron/renderer/app.tsx'),
  },
  target: TARGET,
  devtool: ENV === 'development' ? 'source-map' : false,
  output: {
    path: path.resolve(projectDir, 'build/electron/renderer'),
    filename: "[name].js"
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(projectDir, 'src/electron/renderer/index.html'),
      filename: "index.html"
    }),
    new webpack.DefinePlugin({
      TARGET: JSON.stringify(TARGET),
      ENV: JSON.stringify(ENV),
    })
  ]
}
