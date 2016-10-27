import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLInt } from 'graphql'
import db, {aql} from '../../db'

import {routeType} from './route'

export const tripType = new GraphQLObjectType({
    name: 'Trip',
    fields: () => ({
      trip_id: { type: new GraphQLNonNull(GraphQLString) },
      service_id: { type: new GraphQLNonNull(GraphQLString) },
      direction_id: { type: GraphQLInt },
      label: {
        type: GraphQLString,
        resolve: ({ trip_headsign }) => trip_headsign
      },
      route: {
        type: new GraphQLNonNull(routeType),
        resolve: ({ route_id }) => {
          return db().query(aql`
              for route in routes
              filter route.route_id == ${route_id}
              return route
            `).then(cursor => cursor.next() )
              .then(route => route )
        }
       }
    })
})

//trip_headsign
