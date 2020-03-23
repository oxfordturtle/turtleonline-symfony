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
        { urlPattern: 'https://kit.fontawesome.com/03273b8e38.js', handler: 'StaleWhileRevalidate' },
        { urlPattern: 'https://kit-free.fontawesome.com/releases/latest/css/free.min.css', handler: 'StaleWhileRevalidate' },
        { urlPattern: '/', handler: 'StaleWhileRevalidate' },
        { urlPattern: '/index.css', handler: 'StaleWhileRevalidate' },
        { urlPattern: '/index.js', handler: 'StaleWhileRevalidate' },
        { urlPattern: /\/images\/\.*\.(png|jpe?g)$/, handler: 'StaleWhileRevalidate' },
        { urlPattern: '/favicon.ico', handler: 'StaleWhileRevalidate' },
        { urlPattern: /\/icons\/\.*\.png$/, handler: 'StaleWhileRevalidate' },
        { urlPattern: /\/examples\/.*/, handler: 'StaleWhileRevalidate' },
        { urlPattern: '/run', handler: 'StaleWhileRevalidate' },
        { urlPattern: /\/documentation*/, handler: 'StaleWhileRevalidate' },
        { urlPattern: '/about', handler: 'StaleWhileRevalidate' },
        { urlPattern: '/contact', handler: 'StaleWhileRevalidate' }
      ]
    })
  ]
}
