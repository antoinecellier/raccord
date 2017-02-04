import moment from 'moment'
import { isBoolean, isUndefined } from 'lodash';
import db, {aql} from '../db'
import Stop from './types/stop'
import Station from './types/station'

const Query = `
  type Query {
    stations(search: String, line: String, wheelchairBoarding: Boolean, from: Int!, length: Int!): [Station],
    favoriteStations(user: String!, from: Int!, length: Int!): [Station],
    stops(stationId: String!, after: String!, from: Int!, length: Int!): [Stop]
  }
`

export default () => [Query, Station, Stop]

export const resolvers = {
  Query: {
    stations (_, { search = '', line = '', wheelchairBoarding, from, length }) {
      const wheelchairBoardingBool = isBoolean(wheelchairBoarding) ? wheelchairBoarding : false;
      console.log(line)
      return db().query(
        aql`
          let trip_ids_by_route_id = (
            for trip in trips
            filter trip.route_id == ${line}
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
            filter (${wheelchairBoardingBool} || stop.wheelchair_boarding == 0)
            and (!${wheelchairBoardingBool} || stop.wheelchair_boarding == 1)
            return stop.parent_station)

          for stop in (${search} ? fulltext(stops, "stop_name", concat("prefix:", ${search})) : stops)
          filter stop.location_type == 1
          and (${line === ''} || stop.stop_id in parent_stations_by_line)
          and (${wheelchairBoarding === undefined} || stop.stop_id in parent_stations_by_wheelchair_boarding)
          sort stop.stop_name asc
          limit ${from}, ${length}
          return stop
        `
      ).then(cursor => cursor.all())
    },
    favoriteStations (_, { user, from, length }) {
      return db().query(aql`
          for favorite_stop in favorite_stops
          limit ${from}, ${length}
          return favorite_stop
        `).then(cursor => cursor.all())
    },
    stops (_, {stationId, after, from, length}) {
      const afterMoment = moment(after)
      const afterWeekday = afterMoment.format('dddd').toLowerCase()
      const afterDay = parseInt(afterMoment.format('YYYYMMDD'))
      const afterTime = afterMoment.format('HH:mm:ss')
      return db().query(aql`
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
          filter stop.parent_station == ${stationId}
          return stop.stop_id)

        for stop_time in stop_times
        filter stop_time.stop_id in children_stops && stop_time.trip_id in active_trips && stop_time.departure_time >= ${afterTime}
        sort stop_time.departure_time
        limit ${from}, ${length}
        return stop_time
      `).then(cursor => cursor.all())
    }
  }
}
