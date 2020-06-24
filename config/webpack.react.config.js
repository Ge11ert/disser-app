const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const projectDir = path.resolve(__dirname, '..');

module.exports = {
  entry: {
    app: path.join(projectDir, 'src/electron/renderer/index.tsx'),
  },
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
    new HtmlWebpackPlugin({
      template: path.join(projectDir, 'src/electron/renderer/index.html'),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    contentBase: path.resolve(projectDir, 'build/electron/renderer'),
    hot: true,
    host: '0.0.0.0',
    port: 8080,
    historyApiFallback: true,
    stats: {
      modules: false,
      cached: false,
      colors: true,
      chunk: false,
    },
  }
}
