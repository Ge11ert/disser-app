const path = require('path');

const projectDir = path.resolve(__dirname, '..');

module.exports = {
  entry: path.join(projectDir, 'src/index.ts'),
  target: "electron-main",
  output: {
    path: path.resolve(projectDir, 'build-new'),
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
}
