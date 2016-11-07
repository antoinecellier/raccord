import {parse} from 'graphql/language/parser'
import { print } from 'graphql/language/printer'
import _ from 'lodash'

// [["stations", "search", "co", {"from":0, "length": 10},[ "id", "label"]]]
// [["stations", "search", "co", {"from":0, "length": 10}, "routes", {"length": 20}, "label"]],

export default function translate (inputFalcor) {
  const falcorRequest = inputFalcor
  let graphQlRequest = '{'
  if (falcorRequest[0]) {
    const request = falcorRequest[0]

    graphQlRequest = graphQlRequest.concat(request[0])

    const indexOfPagination = _.findIndex(request, (o) => _.isObject(o))

    if (_.isObject(request[1])) {
      graphQlRequest = graphQlRequest.concat('(')
      _.forIn(request[1], (v, k) => {
        graphQlRequest = graphQlRequest.concat(`${k}:${v},`)
      })
      graphQlRequest = graphQlRequest.concat('){')
    } else if (_.isObject(request[3])) {
      graphQlRequest = graphQlRequest.concat('(')
      graphQlRequest = graphQlRequest.concat(`${request[1]}:"${request[2]}", `)
      _.forIn(request[indexOfPagination], (v, k) => {
        graphQlRequest = graphQlRequest.concat(`${k}:${v}, `)
      })
      graphQlRequest = graphQlRequest.concat('){')
    } else if (_.isObject(request[5])) {
      graphQlRequest = graphQlRequest.concat('(')
      graphQlRequest = graphQlRequest.concat(`${request[1]}:"${request[2]}", `)
      graphQlRequest = graphQlRequest.concat(`${request[3]}:"${request[4]}", `)
      _.forIn(request[indexOfPagination], (v, k) => {
        graphQlRequest = graphQlRequest.concat(`${k}:${v}, `)
      })
      graphQlRequest = graphQlRequest.concat('){')
    }

    let subRequest = false

    _.forIn(_.slice(request, indexOfPagination + 1), (v, k) => {
      if (_.isObject(v) && !_.isArray(v)) {
        graphQlRequest = graphQlRequest.slice(0, -1)
        graphQlRequest = graphQlRequest.concat(`(`)
        _.forIn(v, (v, k) => {
          graphQlRequest = graphQlRequest.concat(`${k}:${v},`)
        })
        graphQlRequest = graphQlRequest.concat(`){`)
        subRequest = true
      } else {
        graphQlRequest = graphQlRequest.concat(`${v},`)
      }
    })
    if (subRequest) {
      graphQlRequest = graphQlRequest.concat('}')
    }

    graphQlRequest = graphQlRequest.concat('}')
  }
  graphQlRequest = graphQlRequest.concat('}')
  return print(parse(graphQlRequest))
}
