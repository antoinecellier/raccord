import fs from 'fs'
import http from 'http'
import spdy from 'spdy'
import express from 'express'
import rest from './rest'
import errorHandlers from './error-handlers'

export default port => {
  const handler = express()
    .get('/', (req, res) => res.send("It's working!"))
    .get('/favicon.ico', (req, res) => res.sendStatus(204))
    .use('/rest', rest)
    .use(errorHandlers.joi)
    .use(errorHandlers.boom)
    .use(errorHandlers.arango)

  http.createServer(handler).listen(port, err => {
    if (err) throw err
    console.log('http server started on port', port)
  })

  try {
    const options = {
      key: fs.readFileSync('./localhost.key'),
      cert: fs.readFileSync('./localhost.crt')
    }
    spdy.createServer(options, handler).listen(port + 1, err => {
      if (err) throw err
      console.log('http2 server started on port', port + 1)
    })
  } catch (err) {
    console.warn('failed to start http2 server:', err.message)
  }
}
