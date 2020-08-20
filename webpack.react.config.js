const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const projectDir = path.resolve(__dirname, './');

module.exports = {
  entry: {
    app: path.join(projectDir, 'src/electron/renderer/app.tsx'),
  },
  target: "electron-renderer",
  devtool: 'source-map',
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
  ]
}
