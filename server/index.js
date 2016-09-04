process.on('unhandledRejection', (reason, promise) => {
  console.error(JSON.stringify(reason))
  throw reason
})
require('babel-core/register')
require('./flat-map-polyfill')
require('./server').default(7080)
