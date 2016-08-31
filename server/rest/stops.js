import express from 'express'
import co from 'co-express'
import moment from 'moment'
import joi from 'joi'
import boom from 'boom'
import db, {aql} from '../db'
import {schema as paginationParametersSchema} from './pagination'
import {stationDbId} from './stations'

const stopsByStationParametersSchema = joi.object().keys({
  station: joi.string().length(4).required(),
  after: joi.string().isoDate().required()
}).concat(paginationParametersSchema)

const stopsByTripIdAndStopOrderSchema = joi.object().keys({
  tripId: joi.string().required(),
  stopOrder: joi.number().required()
})

export default express.Router()

  .get('/stops', co(function* (req, res) {
    const {station, after, from, length} = joi.attempt(req.query, stopsByStationParametersSchema)

    const afterMoment = moment(after)
    const afterWeekday = afterMoment.format('dddd').toLowerCase()
    const afterDay = parseInt(afterMoment.format('YYYYMMDD'))
    const afterTime = afterMoment.format('HH:mm:ss')

    const cursor = yield db().query(aql`
      let active_services = (
        for service in calendar
        filter service.${afterWeekday} == 1 && service.start_date <= ${afterDay} && service.end_date >= ${afterDay}
        return service.service_id)

      let active_trips = (
        for trip in trips
        filter trip.service_id in active_services
        return trip.trip_id)

      let children_stops = (
        for stop in stops
        filter stop.parent_station == ${stationDbId(station)}
        return stop.stop_id)

      for stop_time in stop_times
      filter stop_time.stop_id in children_stops && stop_time.trip_id in active_trips && stop_time.departure_time >= ${afterTime}
      sort stop_time.departure_time
      limit ${from}, ${length}
      return stop_time
    `)
    const stops = yield cursor.map(stopDtoId)
    res.json(stops)
  }))

  .get('/stops/:tripId/:stopOrder', co(function* (req, res) {
    const {tripId, stopOrder} = joi.attempt(req.params, stopsByTripIdAndStopOrderSchema)
    const cursor = yield db().query(aql`
      for stop_time in stop_times
      filter stop_time.trip_id == ${tripId} && stop_time.stop_sequence == ${stopOrder}
      return stop_time
    `)
    const stop = yield cursor.next()
    if (!stop) throw boom.notFound()
    res.json(stopDto(stop))
  }))


export function stopDtoId ({trip_id, stop_sequence}) {
  return `stops/${trip_id}/${stop_sequence}` // eslint-disable-line camelcase
}

export function stopDto ({trip_id, stop_sequence, departure_time}) {
  return {
    href: stopDtoId({trip_id, stop_sequence}),
    time: departure_time
  }
}
