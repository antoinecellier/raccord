import { GraphQLError, GraphQLNonNull, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import db, {aql} from '../db'

import {stopType, stopDbId} from './types/stop'
import {stopTimeType} from './types/stopTime'
import {favoriteStopType} from './types/favoriteStop'

export default new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    addFavorite: {
      type: favoriteStopType,
      args: {
        stop_id: { type: new GraphQLNonNull(GraphQLString) },
        user_id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: (_, { stop_id, user_id }) => {
        return db().query(aql`
            for favorite_stop in favorite_stops
            filter favorite_stop.stop_id == ${stopDbId(stop_id)} && favorite_stop.user_id == ${user_id}
            return favorite_stop
          `).then(cursor => {
            if (cursor.hasNext()) throw new GraphQLError('This stop is already in the user\'s favorites')

            return db().query(aql`
                for stop in stops
                filter stop.stop_id == ${stopDbId(stop_id)}
                insert {"user_id": ${user_id}, "stop_id": ${stopDbId(stop_id)}} into favorite_stops
                return {"user_id": ${user_id}, "stop_id": ${stopDbId(stop_id)}}
                `).then(cursor => cursor.next())
                  .then(stop => stop)
          })
      }
    },
    removeFavorite: {
      type: favoriteStopType,
      args: {
        stop_id: { type: new GraphQLNonNull(GraphQLString) },
        user_id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: (_, { stop_id, user_id }) => {
        return db().query(aql`
            for favorite_stop in favorite_stops
            filter favorite_stop.stop_id == ${stopDbId(stop_id)} && favorite_stop.user_id == ${user_id}
            return favorite_stop
          `).then(cursor => {
            if (!cursor.hasNext()) throw new GraphQLError('This stop is not present in the user\'s favorites')
            return cursor.next()
          }).then(favorite => {
            return db().query(aql`
                for favorite_stop in favorite_stops
                filter favorite_stop.stop_id == ${stopDbId(stop_id)} && favorite_stop.user_id == ${user_id}
                remove favorite_stop into favorite_stops
                return favorite_stop
                `).then(cursor => cursor.next())
                  .then(favorite => favorite)
          })
      }
    }
  })
})
