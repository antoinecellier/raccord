import FalcorRouter from 'falcor-router'
import {dataSourceRoute as falcor} from 'falcor-express'
import ranges from 'falcor-router/src/operations/ranges/convertPathKeyToRange'
import db from './db'
import aqb from 'aqb'
import express from 'express'
import bodyParser from 'body-parser'
import co from 'co'
import {Observable} from 'rx'
import _ from 'lodash'

const routes = [
  {
    route: 'stations.byId[{keys:ids}][{keys:props}]',
    get: function ([stations, byId, ids, props]) {
      const query = aqb.for('station').in('stops')
        .filter(aqb.eq('station.location_type', 1))
        .filter(aqb.in('station.stop_id', aqb.list(ids.map(stationDbId).map(aqb.str))))
        .return('station')
      const mapper = stations => stations
        .map(stationDto)
        .reduce((stationsById, station) => _.assign(stationsById, {[station.id]: _.pick(station, props)}), {})
      return [{
        path: [stations, byId],
        value: {$type: 'aql', query, mapper, paths: [ids, props]}
      }]
    }
  },
  {
    route: 'routes.byId[{keys:ids}][{keys:props}]',
    get: function ([routes, byId, ids, props]) {
      const query = aqb.for('route').in('routes')
        .filter(aqb.in('route.route_id', aqb.list(ids.map(routeDbId).map(aqb.str))))
        .return('route')
      const mapper = routes => routes
        .map(routeDto)
        .reduce((routesById, route) => _.assign(routesById, {[route.id]: _.pick(route, props)}), {})
      return [{
        path: [routes, byId],
        value: {$type: 'aql', query, mapper, paths: [ids, props]}
      }]
    }
  },
  {
    route: 'stations.byId[{keys:ids}].routes[{keys}]',
    get: function ([stations, byId, ids, routes, keys]) {
      const [{from, to} = {from: 0, to: -1}] = ranges(keys)
      const query = aqb.for('station_id').in(aqb.list(ids.map(stationDbId)))
        .let('children_stops',
          aqb.for('stop').in('stops')
          .filter(aqb.eq('stop.parent_station', aqb.ref('station_id')))
          .return('stop.stop_id'))
        .let('connected_trips',
          aqb.for('stop_time').in('stop_times')
          .filter(aqb.in('stop_time.stop_id', 'children_stops'))
          .return('stop_time.trip_id'))
        .let('connected_routes',
          aqb.for('trip').in('trips')
          .filter(aqb.in('trip.trip_id', 'connected_trips'))
          .returnDistinct('trip.route_id'))
        .let('route_ids',
          aqb.for('route_id').in('connected_routes')
          .sort('route_id', 'asc')
          .limit(from, to - from + 1)
          .return('route_id'))
        .return(aqb.obj({
          stationId: 'station_id',
          routeIds: 'route_ids',
          routeCount: aqb.fn('length')('connected_routes')
        }))

    }
  }
]

export default express.Router()
  .use(bodyParser.urlencoded({extended: false}))
  .use('/', falcor(() => aqlDataSource(new FalcorRouter(routes))))

function aqlDataSource (router) {
  function get (paths) {
    return router.get(paths).flatMap(jsonGraph => {
      return Observable.fromPromise(co(function* () {
        const queries = _(collect(jsonGraph, {$type: 'aql'}))
          .map(query => _.assign(query, {id: uniqueId()}))
          .keyBy('id')
          .value()
        const bindings = _.reduce(queries, (bindings, {id, query}) => bindings.let(id, query), aqb)
        const selector = _.mapValues(queries, 'id')
        const query = bindings.return(aqb.obj(selector))
        const cursor = yield db().query(query)
        const dbResults = yield cursor.next()
        return _.cloneDeepWith(jsonGraph, value => {
          if (value.$type === 'aql') return value.mapper(dbResults[value.id])
        })
      })).doOnError(console.error)
    })
  }
  return {get}

  function uniqueId () {
    return _.uniqueId('x') // prefix with a letter to make it a valid AQL identifier
  }

  function collect (obj, predicate) {
    const results = []
    _.cloneDeepWith(obj, value => {
      if (_.iteratee(predicate)(value)) results.push(value)
    })
    return results
  }
}

function stationDbId (stationDtoId) {
  return 'StopArea:' + stationDtoId
}

function stationDtoId (stopDbId) {
  return stopDbId.split(':')[1]
}

function stationDto ({stop_id: stopId, stop_name, stop_lat, stop_lon}) {
  return {
    id: stopId && stationDtoId(stopId),
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
    label: String(route_short_name),
    description: route_long_name
  }
}
