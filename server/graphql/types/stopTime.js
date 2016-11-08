import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from 'graphql'
import db, {aql} from '../../db'

import {stationType} from './station'
import {routeType} from './route'

export const stopTimeType = new GraphQLObjectType({
  name: 'Stop',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ _id }) => _id
    },
    direction: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ trip_id }) => {
        return db().query(aql`
            for trip in trips
            filter trip.trip_id == ${trip_id}
            return trip
            `).then(cursor => cursor.next())
              .then(trip => trip.trip_headsign)
      }
    },
    route: {
      type: new GraphQLNonNull(routeType),
      resolve: ({ trip_id }) => {
        return db().query(aql`
              let routeID = (for trip in trips
                filter trip.trip_id == ${trip_id}
                return trip.route_id)

              for route in routes
              filter route.route_id in routeID
              return route
            `).then(cursor => cursor.next())
              .then(route => route)
      }
    },
    time: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ departure_time }) => departure_time
    },
    station: {
      type: new GraphQLNonNull(stationType),
      resolve: ({ stop_id }) => {
        return db().query(aql`
              for stop in stops
              filter stop.stop_id == ${stop_id}
              return stop
            `).then(cursor => cursor.next())
              .then(station => station)
      }
    }
  })
})
