import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLEnumType } from 'graphql'

import {routeType} from './route'

export const tripType = new GraphQLObjectType({
    name: 'Trip',
    fields: () => ({
      trip_id: { type: new GraphQLNonNull(GraphQLString) },
      service_id: { type: new GraphQLNonNull(GraphQLString) },
      route_id: {
        type: new GraphQLNonNull(routeType),
        resolve: ({ route_id } => {
          return db().query(aql`
              for route in routes
              filter route.route_id == ${route_id}
              return route
            `).then(cursor => cursor.next() )
              .then(route => route )
        })
       },
      transportation: { type: new GraphQLNonNull(TransportationType)}
    })
})

const TransportationType = new GraphQLEnumType({
  name: 'PickupType',
  values: {
    Tram: {
      value: 0
    },
    Subway: {
      value: 1
    },
    Rail: {
      value: 2
    },
    Bus: {
      value: 3
    },
    Ferry: {
      value: 4
    },
    CableCar: {
      value: 5
    },
    Gondola: {
      value: 6
    },
    Funicular: {
      value: 7
    }
  }
});
