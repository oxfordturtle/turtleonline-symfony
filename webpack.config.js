const path = require('path')
const WorkboxPlugin = require('workbox-webpack-plugin')

module.exports = {
  entry: './app/index.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'public/build')
  },
  plugins: [
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true
    })
  ],
  module: {
    rules: [
      {
        test: /\.s?css/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(png|jpe?g|svg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 8000, // Convert images < 8kb to base64 strings
            name: 'images/[name].[ext]'
          }
        }]
      }
    ]
  }
}
