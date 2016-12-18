import db, {aql} from '../../db'
import Route from './route'
import Station from './station'

const Stop = `
  type Stop {
    id: String!,
    name: String!,
    latitude: Float!,
    longitude: Float!,
    parent_station: Station,
    routes: [Route]
  }
`

export default () => [Stop, Station, Route]

export const resolvers = {
  Stop: {
    id({ stop_id }) {
      return stop_id
    },
    name({ stop_name }) {
      return stop_name
    },
    latitude({ stop_lat }) {
      return stop_lat
    },
    longitude({ stop_lon }) {
      return stop_lon
    },
    parent_station({ parent_station }) {
      return db().query(aql`
        for stop in stops
        filter stop.stop_id == ${parent_station}
        return stop
      `).then(cursor => cursor.next())
        .then(station => station )s
    },
    routes({ stop_id }) => {
      return db().query(aql`
          let stop_times_of_stop = (
            for stop_time in stop_times
            filter stop_time.stop_id == ${stop_id}
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

// export const stopFields = {
//   stop_id: { type: new GraphQLNonNull(GraphQLString) },
//   stop_name: { type: new GraphQLNonNull(GraphQLString) },
//   stop_lat: { type: new GraphQLNonNull(GraphQLFloat) },
//   stop_lon: { type: new GraphQLNonNull(GraphQLFloat) },
//   parent_station: {
//     type: stationType,
//     resolve: ({ parent_station }) => {
//       return db().query(aql`
//         for stop in stops
//         filter stop.stop_id == ${parent_station}
//         return stop
//       `).then(cursor => cursor.next())
//         .then(station => station );
//     }
//   },
//   routes: {
//     type: new GraphQLList(routeType),
//     resolve: ({ stop_id }) => {
//       return db().query(aql`
//           let stop_times_of_stop = (
//             for stop_time in stop_times
//             filter stop_time.stop_id == ${stop_id}
//             return stop_time.trip_id
//           )
//
//           let routes_of_stops = (
//             for trip in trips
//             filter trip.trip_id in stop_times_of_stop
//             return trip.route_id
//           )
//
//           for route in routes
//           filter route.route_id in routes_of_stops
//           return route
//         `).then(cursor => cursor.all())
//     }
//   }
// }
//
// export const stopType = new GraphQLObjectType({
//     name: 'Stop2',
//     fields: () => (stopFields)
// })

export function stopDbId (stopDtoId) {
  return 'StopPoint:' + stopDtoId
}
