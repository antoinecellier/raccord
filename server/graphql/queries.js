import moment from 'moment'
import db, {aql} from '../db'
import Stop from './types/stop'
import Station from './types/station'

const Query = `
  type Query {
    stations(search: String, from: Int!, length: Int!): [Station],
    favoriteStations(user: String!, from: Int!, length: Int!): [Station],
    stops(stationId: String!, after: String!, from: Int!, length: Int!): [Stop]
  }
`

export default () => [Query, Station, Stop]

export const resolvers = {
  Query: {
    stations (_, { search = '', from, length }) {
      return db().query(aql`
          for stop in (${search} ? fulltext(stops, "stop_name", concat("prefix:", ${search})) : stops)
          filter stop.location_type == 1
          sort stop.stop_name asc
          limit ${from}, ${length}
          return stop
        `).then(cursor => cursor.all())
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
