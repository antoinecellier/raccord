import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLEnumType } from 'graphql'
import db, {aql} from '../../db'

export const routeType = new GraphQLObjectType({
    name: 'Route',
    fields: () => ({
      route_id: { type: new GraphQLNonNull(GraphQLString) },
      label: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ route_long_name }) => route_long_name
      }
    })
})
