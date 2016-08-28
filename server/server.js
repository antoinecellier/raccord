import fs from 'fs'
import http from 'http'
import spdy from 'spdy'
import express from 'express'
import rest from './rest'

export default (port) => {
  const handler = express()
    .get('/', (req, res) => res.send("It's working!"))
    .use('/rest', rest)
    .use(function (err, req, res, next) {
      if (err.isJoi) res.status(400).json(err)
      else next(err)
    })
    .use(function (err, req, res, next) {
      if (err.isBoom) res.status(err.output.statusCode).json(err.output)
      else next(err)
    })

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
