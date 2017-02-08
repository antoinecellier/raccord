import express from 'express'
import bodyParser from 'body-parser'
import {dataSourceRoute as falcor} from 'falcor-express'
import FalcorRouter from 'falcor-router'
import ranges from 'falcor-router/src/operations/ranges/convertPathKeyToRange'
import flatten from 'lodash.flatten'
import moment from 'moment'
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
    route: 'stations[{integers:indices}]',
    get: co.wrap(function* ([stations, indices]) {
      return indices.map(index => ({
        path: [stations, index],
        value: {$type: 'ref', value: [stations, 'alphabetical', index]}
      }))
    })
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
      return yield cursor.map((stationId, index) => ({
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
      return yield cursor.map((stationId, index) => ({
        path: [stations, search, query, from + index],
        value: {$type: 'ref', value: [stations, 'byId', stationId]}
      }))
    })
  },
  {
    route: 'stations.near[{keys:nearEnabled}].wheelchairBoarding[{keys:wheelchairBoardingEnabled}].line[{keys:lineNumbers}].search[{keys:queries}][{ranges:indices}]',
    get: co.wrap(function* ([stations, near, [nearEnabled], wheelchairBoarding, [wheelchairBoardingEnabled], line, [lineNumber], search, [query], [{from, to}]]) {
      // Laboratoire d'informatique de Grenoble (Snowcamp)
      const currentPosition = { latitude: 45.19228, longitude: 5.7650086}

      const cursor = yield db().query(aql`
        let route_ids_by_short_name = (
            for route in routes
            filter route.route_short_name == ${lineNumber}
            return route.route_id)

        let trip_ids_by_route_id = (
          for trip in trips
          filter trip.route_id in route_ids_by_short_name
          return trip.trip_id)

        let stop_ids_by_trip = (
          for stop_time in stop_times
          filter stop_time.trip_id in trip_ids_by_route_id
          return stop_time.stop_id)

        let parent_stations_by_line = (
          for stop in stops
          filter stop.stop_id in stop_ids_by_trip
          return stop.parent_station)

        let parent_stations_by_wheelchair_boarding = (
          for stop in stops
          filter (${wheelchairBoardingEnabled} || stop.wheelchair_boarding == 0)
          and (!${wheelchairBoardingEnabled} || stop.wheelchair_boarding == 1)
          return stop.parent_station)

        let stops_by_search = (
            for stop in (${query} ? fulltext(stops, "stop_name", concat("prefix:", ${query})) : stops)
            return stop.stop_id
        )

        for stop in (${near} ? near("stops", ${currentPosition.latitude}, ${currentPosition.longitude}) : stops)
        filter stop.location_type == 1
        and (${search === undefined} || stop.stop_id in stops_by_search)
        and (${line === ''} || stop.stop_id in parent_stations_by_line)
        and (${wheelchairBoardingEnabled === undefined} || stop.stop_id in parent_stations_by_wheelchair_boarding)
        limit ${from}, ${to - from + 1}
        return stop.stop_id
      `)
      return yield cursor.map((stationId, index) => ({
        path: [stations, near, nearEnabled, wheelchairBoarding, wheelchairBoardingEnabled, line, lineNumber, search, query, from + index],
        value: {$type: 'ref', value: [stations, 'byId', stationId]}
      }))
    })
  },
  {
    route: 'stations.byId[{keys:ids}].routes[{keys}]',
    get: co.wrap(function* ([stations, byId, ids, routes, keys]) {
      const [{from, to} = {from: 0, to: -1}] = ranges(keys)
      const cursor = yield db().query(aql`
        for station_id in ${ids}
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
        path: [stations, byId, stationId, routes, index],
        value: {$type: 'ref', value: [routes, byId, routeDtoId(routeId)]}
      })).concat({
        path: [stations, byId, stationId, routes, 'length'],
        value: routeCount
      }).concat(Array(Math.max(0, to - routeIds.length + 1)).fill().map((zero, index) => ({
        path: [stations, byId, stationId, routes, routeIds.length + index],
        value: {$type: 'atom'}
      })))))
    })
  },
  {
    route: 'stations.byId[{keys:ids}][{keys:props}]',
    get: co.wrap(function* ([stations, byId, ids, props]) {
      const cursor = yield db().query(aql`
        for stop in stops
        filter stop.stop_id in ${ids}
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
    route: 'stations.favorites[{keys:users}][{ranges}]',
    get: co.wrap(function* ([stations, favorites, [userId], [{from, to}]]) {
      const cursor = yield db().query(aql`
        for favorite_stop in favorite_stops
        filter favorite_stop.user_id == ${userId}
        return favorite_stop.stop_id
      `)
      return yield cursor.map((stationId, index) => ({
        path: [stations, favorites, userId, from + index],
        value: {$type: 'ref', value: [stations, 'byId', stationId]}
      }))
    })
  },
  {
    route: 'stations.favorites[{keys:users}].push',
    call: co.wrap(function* ([stations, favorites, [userId]], [stationId]) {
      const cursor = yield db().query(aql`
        let user_favorites = (
          for favorite_stop in favorite_stops
          filter favorite_stop.user_id == ${userId}
          return favorite_stop)
        let the_favorite = (
          for favorite_stop in user_favorites
          filter favorite_stop.stop_id == ${stationId}
          return favorite_stop)[0]
        let index_of_old = position(user_favorites, the_favorite, true)
        let index_of_new = index_of_old >= 0 ? index_of_old : length(user_favorites)
        upsert {stop_id: ${stationId}, user_id: ${userId}}
        insert {stop_id: ${stationId}, user_id: ${userId}}
        update {}
        in favorite_stops
        return index_of_new
      `)
      const indexOfFavorite = yield cursor.next()
      return [{
        path: [stations, favorites, userId, indexOfFavorite],
        value: {$type: 'ref', value: [stations, 'byId', stationId]}
      }]
    })
  },
  {
    route: 'stations.favorites[{keys:users}].remove',
    call: co.wrap(function* ([stations, favorites, [userId]], [stationId]) {
      const cursor = yield db().query(aql`
        let user_favorites = (
          for favorite_stop in favorite_stops
          filter favorite_stop.user_id == ${userId}
          return favorite_stop)
        let the_favorite = (
          for favorite_stop in user_favorites
          filter favorite_stop.stop_id == ${stationId}
          return favorite_stop)[0]
        let index_of_old = position(user_favorites, the_favorite, true)
        remove the_favorite in favorite_stops options {ignoreErrors: true}
        return {indexOfRemovedFavorite: index_of_old}
      `)
      const {indexOfRemovedFavorite} = yield cursor.next()
      if (indexOfRemovedFavorite < 0) return []
      return Array(indexOfRemovedFavorite).fill(0).map((zero, index) => ({
        path: [stations, favorites, userId, index + indexOfRemovedFavorite],
        invalidated: true
      }))
    })
  },
  {
    route: 'stops.stationId[{keys:stationIds}].after[{keys:times}][{ranges:indices}][{keys:props}]',
    get: co.wrap(function* ([stops, stationId, [station], after, [time], [{from, to}], props]) {
      const afterMoment = moment(time)
      const afterWeekday = afterMoment.format('dddd').toLowerCase()
      const afterDay = parseInt(afterMoment.format('YYYYMMDD'))
      const afterTime = afterMoment.format('HH:mm:ss')

      console.log(station, time, from, to, props, afterWeekday, afterDay, afterTime)

      const cursor = yield db().query(aql`
        for service in calendar
          filter service.${afterWeekday} == 1 && service.start_date <= ${afterDay} && service.end_date >= ${afterDay}
          for trip in trips
            filter trip.service_id == service.service_id
            for stop in stops
              filter stop.parent_station == ${station}
              for stop_time in stop_times
                filter stop_time.stop_id == stop.stop_id && stop_time.trip_id == trip.trip_id && stop_time.departure_time >= ${afterTime}
                sort stop_time.departure_time
                limit ${from}, ${to - from + 1}
                return {stop_time, trip, stop}
      `)

      const stopDtos = yield cursor.map(tuple => stopDto(tuple, station))

      return flatten(Array(to - from + 1).fill(0).map((zero, index) => props.map(prop => ({
        path: [stops, stationId, station, after, time, from + index, prop],
        value: stopDtos[index] && stopDtos[index][prop] || {$type: 'error', value: 'nothing here'}
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

function stationDto ({stop_id, stop_name, stop_lat, stop_lon}) {
  return {
    id: stop_id,
    label: stop_name,
    latitude: stop_lat,
    longitude: stop_lon
  }
}

function stopDtoId ({trip_id, stop_sequence}) {
  return `${trip_id}/${stop_sequence}` // eslint-disable-line camelcase
}

function stopDto ({stop_time: {stop_sequence, departure_time}, trip: {trip_id, route_id, trip_headsign}}, stationId) {
  return {
    id: stopDtoId({trip_id, stop_sequence}),
    time: departure_time,
    route: {$type: 'ref', value: ['routes', 'byId', routeDtoId(route_id)]},
    station: {$type: 'ref', value: ['stations', 'byId', stationId]},
    direction: trip_headsign
  }
}

function routeDbId (routeDtoId) {
  // if it's parsable as a number, it will be a number in the db
  // courtesy of our import technique and/or Arango type inference :(
  const asNumber = Number(routeDtoId)
  return isNaN(asNumber) ? routeDtoId : asNumber
}

function routeDtoId (routeDbId) {
  return String(routeDbId)
}

function routeDto ({route_id, route_short_name, route_long_name}) {
  return {
    id: routeDtoId(route_id),
    label: String(route_short_name),
    trip: route_long_name
  }
}

function defaultTo (value, defaultValue) {
  return value === undefined ? defaultValue : value
}
