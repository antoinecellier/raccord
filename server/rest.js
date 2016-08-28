import express from 'express'
import db, {aql} from './db'
import co from 'co-express'
import moment from 'moment'
import joi from 'joi'

const paginationSchema = joi.object().keys({
  from: joi.number().positive().default(0),
  length: joi.number().positive().default(10)
})

const stopByStationIdParametersSchema = joi.object().keys({
  stationId: joi.string().required(),
  after: joi.string().isoDate().required()
}).concat(paginationSchema)

export default express.Router()

  .get('/', (req, res) => {
    res.send('REST here!')
  })

  .get('/stations', co(function* (req, res) {
    const {from, length} = joi.attempt(req.query, paginationSchema)
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

  .get('/stops', co(function* (req, res) {
    const {stationId, after, from, length} = joi.attempt(req.query, stopByStationIdParametersSchema)

    const afterMoment = moment(after)
    const afterWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][afterMoment.isoWeekday() - 1]
    const afterDay = parseInt(afterMoment.format('YYYYMMDD'))
    const afterTime = afterMoment.format('HH:mm:ss')

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
  return co(function* (req, res) {
    try {
      res.json(yield db().collection(collection).document(req.params.id))
    } catch (err) {
      if (err.code) return res.sendStatus(err.code)
      else throw err
    }
  })
}
