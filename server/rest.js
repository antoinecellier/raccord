import express from 'express'
import db, {aql} from './db'
import co from 'co'
import moment from 'moment'
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

  .get('/stations/:id', findByIdIn('stops'))

  .get('/stops', co.wrap(function* (req, res) {
    const {stationId, after, from = 0, length = 10} = evolve(req.query, {
      after: moment, from: parseInt, length: parseInt
    })
    if (!stationId || !after) return res.status(400).json(boom.badRequest('stationId and after are required', {stationId, after}))
    if (!after.isValid()) return res.status(400).json(boom.badRequest('after must be a valid ISO date time', {after}))
    if (!validatePagination(from, length, res)) return

    const afterWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][after.isoWeekday() - 1]
    const afterDay = parseInt(after.format('YYYYMMDD'))
    const afterTime = after.format('HH:mm:ss')

    const cursor = yield db().query(aql`
      let station = document(${'stops/' + stationId})

      let active_services = (
        for service in calendar
        filter service.${afterWeekday} == 1 && service.start_date <= ${afterDay} && service.end_date >= ${afterDay}
        return service.service_id)

      let active_trips = (
        for trip in trips
        filter trip.service_id in active_services
        return trip.trip_id)

      let substops = (
        for stop in stops
        filter stop.parent_station == station.stop_id
        return stop.stop_id)

      for stop_time in stop_times
      filter stop_time.stop_id in substops && stop_time.trip_id in active_trips && stop_time.departure_time >= ${afterTime}
      sort stop_time.departure_time
      limit ${from}, ${length}
      return stop_time._key
    `)
    const stops = yield cursor.all()
    res.json(stops)
  }))

  .get('/stops/:id', findByIdIn('stop_times'))

function findByIdIn (collection) {
  return co.wrap(function* (req, res) {
    try {
      res.json(yield db().collection(collection).document(req.params.id))
    } catch (err) {
      if (err.code) return res.sendStatus(err.code)
      else throw err
    }
  })
}

function validatePagination (from, length, res) {
  if (from < 0 || from !== 0 && !from || length < 0 || length !== 0 && !length) {
    res.status(400).json(boom.badRequest('from and length must be valid positive integers', {from, length}))
    return false
  }
  return true
}

function evolve (obj, transforms) {
  return Object.keys(obj).reduce((evolved, prop) => {
    const transform = transforms[prop] || (x => x)
    return Object.assign(evolved, {[prop]: transform(obj[prop])})
  }, {})
}
