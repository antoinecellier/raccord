import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLEnumType } from 'graphql'
import db, {aql} from '../../db'

export const routeType = new GraphQLObjectType({
    name: 'Route',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ route_id }) => route_id.split('-')[0]
      },
      label: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ route_short_name }) => route_short_name
      },
      trip: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ route_long_name }) => route_long_name
      }
    })
})
