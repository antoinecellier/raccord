import { GraphQLError, GraphQLNonNull, GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import graphqlHTTP from 'express-graphql'
import express from 'express'
import moment from 'moment'
import db, {aql} from '../db'

import {stopType, stopDbId} from './types/stop'
import {stopTimeType} from './types/stopTime'

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      stations: {
        type: new GraphQLList(stopType),
        args: {
          search: { type: GraphQLString },
          from: { type: new GraphQLNonNull(GraphQLInt) },
          length: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: (_, { search, from, length }) => {
          return db().query(aql`
              for stop in (${search} ? fulltext(stops, "stop_name", concat("prefix:", ${search})) : stops)
              filter stop.location_type == 1
              sort stop.stop_name asc
              limit ${from}, ${length}
              return stop
            `).then(cursor => cursor.all())
        }
      },
      stops: {
        type: new GraphQLList(stopType),
        args: {
          search: { type: GraphQLString },
          from: { type: new GraphQLNonNull(GraphQLInt) },
          length: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: (_, { search, from, length }) => {
          return db().query(aql`
              for stop in (${search} ? fulltext(stops, "stop_name", concat("prefix:", ${search})) : stops)
              filter stop.location_type == 0
              sort stop.stop_name asc
              limit ${from}, ${length}
              return stop
            `).then(cursor => cursor.all())
        }
      },
      stopTimes: {
        type: new GraphQLList(stopTimeType),
        args: {
          station: { type: new GraphQLNonNull(GraphQLString) },
          after: { type: new GraphQLNonNull(GraphQLString) },
          from: { type: new GraphQLNonNull(GraphQLInt) },
          length: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: (_, {station, after, from, length}) => {
          const afterMoment = moment(after)
          const afterWeekday = afterMoment.format('dddd').toLowerCase()
          const afterDay = parseInt(afterMoment.format('YYYYMMDD'))
          const afterTime = afterMoment.format('HH:mm:ss')
          return db().query(aql`
            let active_services = (
              for service in calendar
              filter service.${afterWeekday} == 1 && service.start_date <= ${afterDay} && service.end_date >= ${afterDay}
              return service.service_id)

            let active_trips = (
              for trip in trips
              filter trip.service_id in active_services
              return trip.trip_id)

            let children_stops = (
              for stop in stops
              filter stop.stop_id == ${stopDbId(station)}
              return stop.stop_id)

            for stop_time in stop_times
            filter stop_time.stop_id in children_stops && stop_time.trip_id in active_trips && stop_time.departure_time >= ${afterTime}
            sort stop_time.departure_time
            limit ${from}, ${length}
            return stop_time
          `).then(cursor => cursor.all())
        }
      }
    })
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
      addFavorite: {
        type: stopType,
        args: {
          stop_id: { type: new GraphQLNonNull(GraphQLString) },
          user_id: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: (_, { stop_id, user_id }) => {
          return db().query(aql`
              for favorite in favorites
              filter favorite.stop_id == ${stopDbId(stop_id)} && favorite.user_id == ${user_id}
              return favorite
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
        type: stopType,
        args: {
          stop_id: { type: new GraphQLNonNull(GraphQLString) },
          user_id: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: (_, { stop_id, user_id }) => {
          return db().query(aql`
              for favorite in favorites
              filter favorite.stop_id == ${stopDbId(stop_id)} && favorite.user_id == ${user_id}
              return favorite
            `).then(cursor => {
              if (!cursor.hasNext()) throw new GraphQLError('This stop is not present in the user\'s favorites')
              return cursor.next()
            }).then(favorite => {
              return db().query(aql`
                  for favorite in favorites
                  filter favorite.stop_id == ${stopDbId(stop_id)} && favorite.user_id == ${user_id}
                  remove favorite into favorites
                  return favorite
                  `).then(cursor => cursor.next())
                    .then(favorite => favorite)
            })
        }
      }
    })
  })
})

export default express.Router()

  .use('/', graphqlHTTP({ schema , pretty: true, graphiql: true}));
