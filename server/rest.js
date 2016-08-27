import express from 'express'
import db, {aql} from './db'
import co from 'co'
import boom from 'boom'

export default express.Router()
  .get('/', (req, res) => {
    res.send('REST here!')
  })
  .get('/stations', co.wrap(function* (req, res) {
    const {from = 0, length = 10} = evolve(req.query, {
      from: parseInt, length: parseInt
    })
    if (!validatePagination(from, length, res)) return

    const cursor = yield db().query(aql`
      FOR stop IN stops
      FILTER stop.location_type == 1
      LIMIT ${from}, ${length}
      RETURN stop._key
    `)
    const stations = yield cursor.all()
    res.json(stations)
  }))
  .get('/stations/:id', co.wrap(function* (req, res) {
    try {
      res.json(yield db().collection('stops').document(req.params.id))
    } catch (err) {
      if (err.code) return res.sendStatus(err.code)
      else throw err
    }
  }))
  }))

function validatePagination (from, length, res) {
  if (from < 0 || from !== 0 && !from || length < 0 || length !== 0 && !length) {
    res.status(400).json(boom.badRequest('from and length must be valid positive integers', {from, length}))
    return false
  }
}

function evolve (obj, transforms) {
  return Object.keys(obj).reduce((evolved, prop) => {
    const transform = transforms[prop] || (x => x)
    return Object.assign(evolved, {[prop]: transform(obj[prop])})
  }, {})
}
