import parseRoutes from 'falcor-router/src/parse-tree'
import createMatcher from 'falcor-router/src/operations/matcher'
import getExecutablesMatches from 'falcor-router/src/run/precedence/getExecutableMatches'
import {dataSourceRoute as falcor} from 'falcor-express'
import db from './db'
import aqb from 'aqb'
import express from 'express'
import bodyParser from 'body-parser'
import co from 'co'
import sortBy from 'lodash.sortBy'
import {Observable} from 'rx'
import merge from 'lodash.merge'
import shortid from 'shortid'
import set from 'lodash.set'

const stationPropertyMapping = {
  id: 'stop_id',
  name: 'stop_name',
  longitude: 'stop_lon',
  latitude: 'stop_lat'
}

const routePropertyMapping = {
  id: 'route_id',
  label: 'route_short_name',
  description: 'route_long_name'
}

const routes = [
  {
    route: 'stations.byId[{keys:ids}][{keys:props}]',
    get: function ([stations, byId, ids, props]) {
      const propertyOf = prop => aqb.ref('station').get(aqb.str(stationPropertyMapping[prop]))
      const selector = props.reduce((selector, prop) => Object.assign(selector, {[stationPropertyMapping[prop]]: propertyOf(prop)}), {[stationPropertyMapping['id']]: propertyOf('id')})
      const query = aqb.for('station').in('stops')
        .filter(aqb.eq('station.location_type', 1))
        .filter(aqb.in('station.stop_id', aqb.list(ids.map(stationDbId).map(aqb.str))))
        .return(aqb.obj(selector))
      console.log('route query', query.toAQL())
      const mapper = stations => {
        const dtos = stations.map(stationDto)
        return {
          stations: {
            byId: dtos.reduce((stationsById, station) => Object.assign(stationsById, {[station.id]: station}), {})
          }
        }
      }
      return {query, mapper}
    }
  },
  {
    route: 'routes.byId[{keys:ids}][{keys:props}]',
    get: function ([routes, byId, ids, props]) {
      const propertyOf = prop => aqb.ref('route').get(aqb.str(routePropertyMapping[prop]))
      const selector = props.reduce((selector, prop) => Object.assign(selector, {[routePropertyMapping[prop]]: propertyOf(prop)}), {[routePropertyMapping['id']]: propertyOf('id')})
      const query = aqb.for('route').in('routes')
        .filter(aqb.in('route.stop_id', aqb.list(ids.map(routeDbId).map(aqb.str))))
        .return(aqb.obj(selector))
      console.log('route query', query.toAQL())
      const mapper = routes => {
        const dtos = routes.map(routeDto)
        return {
          routes: {
            byId: dtos.reduce((routesById, route) => Object.assign(routesById, {[route.id]: route}), {})
          }
        }
      }
      return {query, mapper}
    }
  }
]

export default express.Router()
  .use(bodyParser.urlencoded({extended: false}))
  .use('/', falcor(() => aqlDataSource(routes)))

function aqlDataSource (routes) {
  const matcher = createMatcher(parseRoutes(routes))
  const rxify = fn => (...args) => Observable.fromPromise(co.wrap(aqlGet.bind(null, matcher))(...args).catch(console.error))
  return {get: rxify(aqlGet)}
}

function* aqlGet (matcher, paths) {
  const matches = sortBy(matcher('get', paths[0]), 'precedence')
  const {matchAndPaths, unhandledPaths} = getExecutablesMatches(matches, paths)
  const actionResults = matchAndPaths.map(({match, path}) => match.action(path))
  const keys = actionResults.map(() => generateKey())
  const bindings = actionResults.reduce((bindings, {query}, index) => bindings.let(keys[index], query), aqb)
  const query = bindings.return(aqb.list(keys))
  const cursor = yield db().query(query)
  const dbResults = yield cursor.next()
  const jsonGraphHandled = keys.reduce((jsonGraph, key, index) => {
    const dbResult = dbResults[index]
    const {mapper} = actionResults[index]
    return merge(jsonGraph, mapper(dbResult))
  }, {})
  const jsonGraphUnhandled = (unhandledPaths || []).reduce((jsonGraph, path) => {
    return set(jsonGraph, path, {$type: 'error', value: 'field does not exist'})
  }, {})
  return {jsonGraph: merge(jsonGraphHandled, jsonGraphUnhandled)}

  function generateKey () {
    return 'x' + shortid.generate().replace('-', '')
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
