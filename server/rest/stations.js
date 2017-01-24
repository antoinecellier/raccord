import express from 'express'
import co from 'co-express'
import joi from 'joi'
import boom from 'boom'
import db, {aql} from '../db'
import {schema as paginationParametersSchema} from './pagination'
import {routeDtoId} from './routes'

const stationsSearchParametersSchema = joi.object().keys({
  search: joi.string().default('')
}).concat(paginationParametersSchema)

export default express.Router()

  .get('/stations', co(function* (req, res) {
    const {search, from, length} = joi.attempt(req.query, stationsSearchParametersSchema)
    const cursor = yield db().query(aql`
      for stop in (${search} ? fulltext(stops, "stop_name", concat("prefix:", ${search})) : stops)
      filter stop.location_type == 1
      sort stop.stop_name asc
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
        filter stop.parent_station == ${id}
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
      filter stop.stop_id == ${id}
      return {stop: stop, routes: connected_routes}
    `)
    const station = yield cursor.next()
    if (!station) throw boom.notFound()
    res.json(stationDto(station))
  }))

export function stationDtoId (stopDbId) {
  return `stations/${stopDbId}`
}

export function stationDto ({stop: {stop_id, stop_name, stop_lat, stop_lon}, routes}) {
  return {
    href: stationDtoId(stop_id),
    name: stop_name,
    latitude: stop_lat,
    longitude: stop_lon,
    routes: routes.map(routeDtoId)
  }
}
