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
      const mapper = (id, prop) => stations => stations.map(stationDto).find(station => station.id === id)[prop]
      return Array.from(product(ids, props)).map(([id, prop]) => ({
        path: [stations, byId, id, prop],
        value: {aql: true, query, mapper: mapper(id, prop)}
      }))
    }
  },
  {
    route: 'routes.byId[{keys:ids}]',
    get: function ([routes, byId, ids, props]) {
      const query = aqb.list(ids.map(routeDbId).map(aqb.str))
      const mapper = x => x
      const queryId = uniqueId()
      return ids.map((id, index) => ({
        path: [routes, byId, id],
        value: {$type: 'ref', value: ['_data', routes, 'route_id', queryId, index], query, id: queryId, aql: true, mapper}
      }))
    }
  },
  {
    route: '_data[{keys:collections}][{keys:fields}][{keys:identifiersInQuery}][{keys:indices}][{keys:props}]',
    get: function ([data, collections, fields, identifiersInQuery, indices, props]) {
      if (collections.length > 1) throw new TypeError('multiple collections are not supported')
      if (fields.length > 1) throw new TypeError('multiple fields are not supported')
      const [collection] = collections
      const [field] = fields
      const [{from, to} = {from: 0, to: -1}] = ranges(indices)
      const values = uniqueId('values')
      const items = uniqueId(collection)
      const item = uniqueId(collection)
      const query = aqb.for(values).in(aqb.list(identifiersInQuery.map(aqb.expr)))
        .let(items,
          aqb.for(item).in(collection)
          .filter(aqb.in(aqb.ref(item).get(aqb.str(field)), values))
          .sort(aqb.ref(item).get(aqb.str(field)), 'asc')
          .limit(from, to - from + 1)
          .return(item))
        .return(items)
      const thisQueryId = uniqueId()
      const mapper = (identifierInQueryIndex, index, prop) => routes => routeDto(routes[identifierInQueryIndex][index])[prop]
      return Array.from(product(collections, fields, identifiersInQuery.entries(), indices, props)).map(([collection, field, [identifierInQueryIndex, identifierInQuery], index, prop]) => ({
        path: [data, collection, field, identifierInQuery, index, prop],
        value: {aql: true, query, mapper: mapper(identifierInQueryIndex, index, prop), id: thisQueryId}
      }))
    }
  },
  {
    route: 'stations.byId[{keys:ids}].routes',
    get: function ([stations, byId, ids, routes, keys]) {
      const query = aqb.fn('zip')(aqb.list(ids.map(aqb.str)), aqb.for('station_id').in(aqb.list(ids.map(stationDbId).map(aqb.str)))
        .let('children_stops',
          aqb.for('stop').in('stops')
          .filter(aqb.eq('stop.parent_station', 'station_id'))
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
          .return('route_id'))
        .return(aqb.obj({
          stationId: 'station_id',
          routeIds: 'route_ids',
          routeCount: aqb.fn('length')('connected_routes')
        })))
      const queryId = ids.join('_')//uniqueId()
      return ids.map((id, index) => ({
        path: [stations, byId, id, routes],
        value: {$type: 'ref', value: ['_data', routes, 'route_id', `${id}["${id}"].routeIds`], aql: true, query, id: queryId, mapper: () => {}, aliases: ids}
      }))
    }
  }
]

export default express.Router()
  .use(bodyParser.urlencoded({extended: false}))
  .use('/', falcor(() => aqlDataSource(new FalcorRouter(routes))))

function aqlDataSource (router) {
  function get (paths) {
    return router.get(paths).doOnError(console.error).flatMap(jsonGraph => {
      return Observable.fromPromise(co(function* () {
        const queries = _(collect(jsonGraph, {aql: true}))
          .map(query => _.defaults(query, {id: uniqueId()}))
          .keyBy('id')
          .value()
        const bindings = _.reduce(queries, (bindings, {id, query, aliases = []}) => {
          const base = bindings.let(id, query)
          return aliases.reduce((newBindings, alias) => newBindings.let(alias, id), base)
        }, aqb)
        const selector = _.mapValues(queries, 'id')
        const query = bindings.return(aqb.obj(selector))
        console.log(query.toAQL())
        const cursor = yield db().query(query)
        const dbResults = yield cursor.next()
        return _.cloneDeepWith(jsonGraph, value => {
          if (!value) return
          if (value.aql && value.$type !== 'ref') return value.mapper(dbResults[value.id])
          if (value.aql && value.query) {
            delete value.query
            delete value.id
            delete value.aql
            delete value.aliases
          }
        })
      }).catch(console.error)).doOnError(console.error)
    })
  }
  return {get}

  function collect (obj, predicate) {
    const results = []
    _.cloneDeepWith(obj, value => {
      if (_.iteratee(predicate)(value)) results.push(value)
    })
    return results
  }
}

function uniqueId (prefix) {
  return _.uniqueId(prefix || 'x') // prefix with a letter to make it a valid AQL identifier
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

function* product (...xss) {
  const [head, ...tail] = xss
  if (head) for (const x of head) for (const xs of product(...tail)) yield [x, ...xs]
  else yield []
}
