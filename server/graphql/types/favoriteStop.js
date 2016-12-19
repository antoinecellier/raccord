import db, {aql} from '../../db'
import Route from './route'

const FavoriteStop = `
  type FavoriteStop {
    id: String!,
    label: String!,
    routes: [Route]
  }
`

export default () => [FavoriteStop, Route]

export const resolvers = {
  FavoriteStop: {
    id ({ stop_id }) {
      return stop_id
    },
    label ({ stop_id }) {
      return db().query(aql`
        for stop in stops
        filter stop.stop_id == ${stop_id}
        return stop.stop_name
        `).then(cursor => cursor.next())
          .then(stop_name => stop_name)
    },
    routes ({ stop_id }) {
      return db().query(aql`
          let stops = (
            for stop in stops
            filter stop.parent_station == ${stop_id}
            return stop.stop_id
          )

          let stop_times_of_stop = (
            for stop_time in stop_times
            filter stop_time.stop_id in stops
            return stop_time.trip_id
          )

          let routes_of_stops = (
            for trip in trips
            filter trip.trip_id in stop_times_of_stop
            return trip.route_id
          )

          for route in routes
          filter route.route_id in routes_of_stops
          return route
        `).then(cursor => cursor.all())
    }
  }
}
