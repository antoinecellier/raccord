import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from 'graphql'
import db, {aql} from '../../db'

import {stopType, stopDbId} from './stop'

export const favoriteStopType = new GraphQLObjectType({
  name: 'FavoriteStop',
  fields: () =>({
    user_id: { type: new GraphQLNonNull(GraphQLString) },
    stop_id: {
      type: stopType,
      resolve: ({ stop_id }) => {
        return db().query(aql`
          for stop in stops
          filter stop.stop_id == ${stop_id}
          return stop
        `).then(cursor => cursor.next())
          .then(stop => stop);
      }
    }
  })
})
