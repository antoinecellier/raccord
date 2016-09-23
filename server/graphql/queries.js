import { GraphQLError, GraphQLNonNull, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql'
import moment from 'moment'

import db, {aql} from '../db'

import {stopType, stopDbId} from './types/stop'
import {stopTimeType} from './types/stopTime'
import {favoriteStopType} from './types/favoriteStop'

export default new GraphQLObjectType({
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
    favoriteStops: {
      type: new GraphQLList(favoriteStopType),
      args: {
        user_id: { type: new GraphQLNonNull(GraphQLString) },
        from: { type: new GraphQLNonNull(GraphQLInt) },
        length: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: (_, { user_id, from, length }) => {
        return db().query(aql`
            for favorite_stop in favorite_stops
            filter favorite_stop.user_id == ${user_id}
            limit ${from}, ${length}
            return favorite_stop
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
})
