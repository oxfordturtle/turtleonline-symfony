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
        // font awesome files (load from cache, then update in the background)
        { urlPattern: 'https://kit.fontawesome.com/03273b8e38.js', handler: 'StaleWhileRevalidate' },
        { urlPattern: 'https://kit-free.fontawesome.com/releases/latest/css/free.min.css', handler: 'StaleWhileRevalidate' },
        // css and js (load from cache, then update in the background)
        { urlPattern: '/index.css', handler: 'StaleWhileRevalidate' },
        { urlPattern: '/index.js', handler: 'StaleWhileRevalidate' },
        { urlPattern: /\/examples\/.*/, handler: 'StaleWhileRevalidate' },
        //images (load from cache, then update in the background)
        { urlPattern: '/favicon.ico', handler: 'StaleWhileRevalidate' },
        { urlPattern: /\/icons\/\.*\.png$/, handler: 'StaleWhileRevalidate' },
        { urlPattern: /\/images\/\.*\.(png|jpe?g)$/, handler: 'StaleWhileRevalidate' },
        // pages (network first, falling back to cache)
        { urlPattern: '/', handler: 'NetworkFirst' },
        { urlPattern: '/run', handler: 'NetworkFirst' },
        { urlPattern: /\/documentation*/, handler: 'NetworkFirst' },
        { urlPattern: '/about', handler: 'NetworkFirst' },
        { urlPattern: '/contact', handler: 'NetworkFirst' }
      ]
    })
  ]
}
