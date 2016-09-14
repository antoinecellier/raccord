import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLEnumType } from 'graphql'


export const routeType = new GraphQLObjectType({
    name: 'Route',
    fields: () => ({
      route_id: { type: new GraphQLNonNull(GraphQLString) },
      route_short_name: { type: new GraphQLNonNull(GraphQLString) },
      route_long_name: { type: new GraphQLNonNull(GraphQLString) }
    })
})
