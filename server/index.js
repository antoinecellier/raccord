process.on('unhandledRejection', (reason, promise) => { throw reason })
require('babel-core/register')
require('./server').default(7080)
