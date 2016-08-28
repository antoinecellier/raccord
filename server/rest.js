import express from 'express'
import db, {aql} from './db'
import co from 'co-express'
import moment from 'moment'
import joi from 'joi'
import boom from 'boom'

const paginationParametersSchema = joi.object().keys({
  from: joi.number().positive().default(0),
  length: joi.number().positive().default(10)
})

const stationsSearchParametersSchema = joi.object().keys({
  search: joi.string().default('')
}).concat(paginationParametersSchema)

const stopsByStationIdParametersSchema = joi.object().keys({
  stationId: joi.string().required(),
  after: joi.string().isoDate().required()
}).concat(paginationParametersSchema)

const stopsByTripIdAndStopOrderSchema = joi.object().keys({
  tripId: joi.string().required(),
  stopOrder: joi.number().required()
})

export default express.Router()

  .get('/', (req, res) => {
    res.send('REST here!')
  })

  .get('/stations', co(function* (req, res) {
    const {search, from, length} = joi.attempt(req.query, stationsSearchParametersSchema)
    const cursor = yield db().query(aql`
      for stop in (${search} ? fulltext(stops, "stop_name", concat("prefix:", ${search})) : stops)
      filter stop.location_type == 1
      limit ${from}, ${length}
      return stop.stop_id
    `)
    const stations = yield cursor.map(stationDtoId)
    res.json(stations)
  }))

  .get('/stations/:id', co(function* (req, res) {
    const id = req.params.id
    const cursor = yield db().query(aql`
      let children_stops = (
        for stop in stops
        filter stop.parent_station == ${stationDbId(id)}
        return stop.stop_id)

      let connected_trips = (
        for stop_time in stop_times
        filter stop_time.stop_id in children_stops
        return stop_time.trip_id)

      let connected_routes = unique(
        for trip in trips
        filter trip.trip_id in connected_trips
        return trip.route_id)

      for stop in stops
      filter stop.stop_id == ${stationDbId(id)}
      return {stop: stop, routes: connected_routes}
    `)
    const station = yield cursor.next()
    if (!station) throw boom.notFound()
    res.json(stationDto(station))
  }))

  .get('/stops', co(function* (req, res) {
    const {stationId, after, from, length} = joi.attempt(req.query, stopsByStationIdParametersSchema)

    const afterMoment = moment(after)
    const afterWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][afterMoment.isoWeekday() - 1]
    const afterDay = parseInt(afterMoment.format('YYYYMMDD'))
    const afterTime = afterMoment.format('HH:mm:ss')

    const cursor = yield db().query(aql`
      let station = document(concat('stops/', ${stationId}))

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
        filter stop.parent_station == station.stop_id
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

  .get('/routes/:id', co(function* (req, res) {
    const id = req.params.id
    const cursor = yield db().query(aql`
      for route in routes
      filter route.route_id == ${routeDbId(id)}
      return route
    `)
    const route = yield cursor.next()
    if (!route) throw boom.notFound()
    res.json(routeDto(route))
  }))


function stationDbId (stationDtoId) {
  return 'StopArea:' + stationDtoId
}

function stationDtoId (stopDbId) {
  return 'stations/' + stopDbId.split(':')[1]
}

function stationDto ({stop: {stop_id, stop_name, stop_lat, stop_lon}, routes}) {
  return {
    href: stationDtoId(stop_id),
    name: stop_name,
    latitude: stop_lat,
    longitude: stop_lon,
    routes: routes.map(routeDtoId)
  }
}

function routeDbId (routeDtoId) {
  return `${routeDtoId}-0`
}

function routeDtoId (routeDbId) {
  return 'routes/' + routeDbId.split('-')[0]
}

function routeDto ({route_id, route_short_name, route_long_name}) {
  return {
    href: routeDtoId(route_id),
    shortName: String(route_short_name),
    longName: route_long_name
  }
}

function stopDtoId ({trip_id, stop_sequence}) {
  return `stops/${trip_id}/${stop_sequence}` // eslint-disable-line camelcase
}

function stopDto ({_key, departure_time, stop_id, stop_sequence, trip_id}) {
  return {
    href: stopDtoId({trip_id, stop_sequence}),
    time: departure_time
  }
}
