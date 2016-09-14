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
            for favoriteStop in favoriteStops
            filter favoriteStop.stop_id == ${stopDbId(stop_id)} && favoriteStop.user_id == ${user_id}
            return favoriteStop
          `).then(cursor => {
            if (cursor.hasNext()) throw new GraphQLError('This stop is already in the user\'s favorites')

            return db().query(aql`
                for stop in stops
                filter stop.stop_id == ${stopDbId(stop_id)}
                insert unset(merge([stop, {"user_id": ${user_id}, "favorite_id": concat(${user_id}, "_",stop.stop_id)}]), "_id", "_key") into favorites
                return unset(merge([stop, {"user_id": ${user_id}, "favorite_id": concat(${user_id}, "_",stop.stop_id)}]), "_id", "_key")
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
            for favoriteStop in favoriteStops
            filter favoriteStop.stop_id == ${stopDbId(stop_id)} && favoriteStop.user_id == ${user_id}
            return favoriteStop
          `).then(cursor => {
            if (!cursor.hasNext()) throw new GraphQLError('This stop is not present in the user\'s favorites')
            return cursor.next()
          }).then(favorite => {
            return db().query(aql`
                for favoriteStop in favoriteStops
                filter favoriteStop.stop_id == ${stopDbId(stop_id)} && favoriteStop.user_id == ${user_id}
                remove favoriteStop into favoriteStops
                return favoriteStop
                `).then(cursor => cursor.next())
                  .then(favorite => favorite)
          })
      }
    }
  })
})
