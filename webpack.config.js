const path = require('path')
const WorkboxPlugin = require('workbox-webpack-plugin')

module.exports = {
  entry: './app/js/index.js',
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader'
      }
    ]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'public')
  },
  plugins: [
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        { urlPattern: new RegExp('https://kit.fontawesome.com/03273b8e38.js'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/index.css'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/index.js'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/images/*.(png|jpg)'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/favicon.ico'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/icons/*.png'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/examples/*'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/run'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/documentation'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/documentation/*'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/about'), handler: 'StaleWhileRevalidate' },
        { urlPattern: new RegExp('/contact'), handler: 'StaleWhileRevalidate' }
      ]
    })
  ]
}
