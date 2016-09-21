import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from 'graphql'

import {stopFields} from './stop'

export const favoriteStopType = new GraphQLObjectType({
  name: 'FavoriteStop',
  fields: () =>(Object.assign(stopFields, {
                                user_id: { type: new GraphQLNonNull(GraphQLString) },
                                favorite_id: { type: new GraphQLNonNull(GraphQLString) }
                              }))
})
