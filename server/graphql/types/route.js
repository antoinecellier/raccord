import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLEnumType } from 'graphql'


export const routeType = new GraphQLObjectType({
    name: 'Route',
    fields: () => ({
      route_id: { type: new GraphQLNonNull(GraphQLString) },
      route_short_name: { type: new GraphQLNonNull(GraphQLString) },
      route_long_name: { type: new GraphQLNonNull(GraphQLString) },
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
