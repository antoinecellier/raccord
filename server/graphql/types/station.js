import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLEnumType, GraphQLList } from 'graphql'
import db, {aql} from '../../db'

import {routeType} from './route'

export const locationTypeEnum = new GraphQLEnumType({
  name: 'LocationType',
  values: {
    SeveralStop: {
      value: 0
    },
    UniqueStation: {
      value: 1
    }
  }
});

export const stationType = new GraphQLObjectType({
    name: 'Station',
    fields: () => ({
      stop_id: { type: new GraphQLNonNull(GraphQLString) },
      stop_name: { type: new GraphQLNonNull(GraphQLString) },
      stop_lat: { type: new GraphQLNonNull(GraphQLFloat) },
      stop_lon: { type: new GraphQLNonNull(GraphQLFloat) },
      location_type: { type: locationTypeEnum },
      routes: {
        type: new GraphQLList(routeType),
        resolve: ({ stop_id }) => {
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
    })
})

export function stationDbId (stationDtoId) {
  return 'StopArea:' + stationDtoId
}
