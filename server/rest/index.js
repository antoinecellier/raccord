import express from 'express'
import stations from './stations'
import stops from './stops'
import routes from './routes'
import cacheControl from './cache-control'

export default express.Router()
  .use(cacheControl)
  .get('/', (req, res) => res.send('REST here!'))
  .use(stations)
  .use(stops)
  .use(routes)
