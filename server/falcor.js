import express from 'express'
import bodyParser from 'body-parser'
import {dataSourceRoute as falcor} from 'falcor-express'
import FalcorRouter from 'falcor-router'
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

function defaultTo (value, defaultValue) {
  return value === undefined ? defaultValue : value
}
