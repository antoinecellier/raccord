import express from 'express'
import bodyParser from 'body-parser'
import {dataSourceRoute as falcor} from 'falcor-express'
import FalcorRouter from 'falcor-router'
import ranges from 'falcor-router/src/operations/ranges/convertPathKeyToRange'
import flatten from 'lodash.flatten'
import co from 'co'
import db, {aql} from './db'

const routes = [
  {
    route: 'hello',
    get (paths) {
      return [{path: paths, value: paths[0]}]
    }
  },
  {
    route: 'stations.alphabetical[{ranges:indices}]',
    get: co.wrap(function* ([stations, alphabetical, [{from, to}]]) {
      const cursor = yield db().query(aql`
        for stop in stops
        filter stop.location_type == 1
        sort stop.stop_name asc
        limit ${from}, ${to - from + 1}
        return stop.stop_id
      `)
      const stationDtoIds = yield cursor.map(stationDtoId)
      return stationDtoIds.map((stationId, index) => ({
        path: [stations, alphabetical, from + index],
        value: {$type: 'ref', value: [stations, 'byId', stationId]}
      }))
    })
  },
  {
    route: 'stations.search[{keys:queries}][{ranges:indices}]',
    get: co.wrap(function* ([stations, search, queries, [{from, to}]]) {
      const [query] = queries
      const cursor = yield db().query(aql`
        for stop in fulltext(stops, "stop_name", concat("prefix:", ${query}))
        filter stop.location_type == 1
        sort stop.stop_name asc
        limit ${from}, ${to - from + 1}
        return stop.stop_id
      `)
      const stationDtoIds = yield cursor.map(stationDtoId)
      return stationDtoIds.map((stationId, index) => ({
        path: [stations, search, query, from + index],
        value: {$type: 'ref', value: [stations, 'byId', stationId]}
      }))
    })
  },
  {
    route: 'stations.byId[{keys:ids}].routes[{keys}]',
    get: co.wrap(function* ([stations, byId, ids, routes, keys]) {
      const [{from, to} = {from: 0, to: -1}] = ranges(keys)
      const cursor = yield db().query(aql`
        for station_id in ${ids.map(stationDbId)}
          let children_stops = (
            for stop in stops
            filter stop.parent_station == station_id
            return stop.stop_id)

          let connected_trips = (
            for stop_time in stop_times
            filter stop_time.stop_id in children_stops
            return stop_time.trip_id)

          let connected_routes = (
            for trip in trips
            filter trip.trip_id in connected_trips
            return distinct trip.route_id)

          let route_ids = (
            for route_id in connected_routes
            sort route_id asc
            limit ${from}, ${to - from + 1}
            return route_id)

          return {stationId: station_id, routeIds: route_ids, routeCount: length(connected_routes)}
      `)
      return flatten(yield cursor.map(({stationId, routeIds, routeCount}) => routeIds.map((routeId, index) => ({
        path: [stations, byId, stationDtoId(stationId), routes, index],
        value: {$type: 'ref', value: [routes, byId, routeDtoId(routeId)]}
      })).concat({
        path: [stations, byId, stationDtoId(stationId), routes, 'length'],
        value: routeCount
      }).concat(Array(Math.max(0, to - routeIds.length + 1)).fill().map((zero, index) => ({
        path: [stations, byId, stationDtoId(stationId), routes, routeIds.length + index],
        value: {$type: 'atom'}
      })))))
    })
  },
  {
    route: 'stations.byId[{keys:ids}][{keys:props}]',
    get: co.wrap(function* ([stations, byId, ids, props]) {
      const cursor = yield db().query(aql`
        for stop in stops
        filter stop.stop_id in ${ids.map(stationDbId)}
        return stop
      `)
      const stationDtos = yield cursor.map(stationDto)
      return flatten(stationDtos.map(station => props.map(prop => ({
        path: [stations, byId, station.id, prop],
        value: defaultTo(station[prop], {$type: 'error', value: 'field does not exist'})
      }))))
    })
  },
  {
    route: 'routes.byId[{keys:ids}][{keys:props}]',
    get: co.wrap(function* ([routes, byId, ids, props]) {
      const cursor = yield db().query(aql`
        for route in routes
        filter route.route_id in ${ids.map(routeDbId)}
        return route
      `)
      const routeDtos = yield cursor.map(routeDto)
      return flatten(routeDtos.map(route => props.map(prop => ({
        path: [routes, byId, route.id, prop],
        value: defaultTo(route[prop], {$type: 'error', value: 'field does not exist'})
      }))))
    })
  }
]

export default express.Router()
  .use(bodyParser.urlencoded({extended: false}))
  .use('/', falcor(() => new FalcorRouter(routes)))


function stationDbId (stationDtoId) {
  return 'StopArea:' + stationDtoId
}

function stationDtoId (stopDbId) {
  return stopDbId.split(':')[1]
}

function stationDto ({stop_id, stop_name, stop_lat, stop_lon}) {
  return {
    id: stationDtoId(stop_id),
    name: stop_name,
    latitude: stop_lat,
    longitude: stop_lon
  }
}

function routeDbId (routeDtoId) {
  return routeDtoId + '-0'
}

function routeDtoId (routeDbId) {
  return routeDbId.split('-')[0]
}

function routeDto ({route_id, route_short_name, route_long_name}) {
  return {
    id: routeDtoId(route_id),
    shortName: String(route_short_name),
    longName: route_long_name
  }
}

function defaultTo (value, defaultValue) {
  return value === undefined ? defaultValue : value
}
