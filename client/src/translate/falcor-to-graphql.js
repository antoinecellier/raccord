import {parse} from 'graphql/language/parser'
import { print } from 'graphql/language/printer'
import _ from 'lodash'
import falcorPathSyntax from 'falcor-path-syntax'

// [["stations", "search", "co", {"from":0, "length": 10},[ "id", "label"]]]
// [["stations", "search", "co", {"from":0, "length": 10}, "routes", {"length": 20}, "label"]],

export default function translate (inputFalcor) {
  const falcorRequest = inputFalcor
  let graphQlRequest = '{'
  if (falcorRequest[0]) {
    const request = typeof falcorRequest[0] === 'string'
      ? falcorPathSyntax(falcorRequest[0])
      : falcorRequest[0]

    graphQlRequest = graphQlRequest.concat(request[0])

    const indexOfPagination = _.findIndex(request, (o) => _.isObject(o))

    if (_.isObject(request[1])) {
      graphQlRequest = graphQlRequest.concat('(')
      if (request[1].to) {
        request[1].length = request[1].to + 1
        delete request[1].to
      }
      _.forIn(request[1], (v, k) => {
        graphQlRequest = graphQlRequest.concat(`${k}:${v},`)
      })
      graphQlRequest = graphQlRequest.concat('){')
    } else if (_.isObject(request[3])) {
      graphQlRequest = graphQlRequest.concat('(')
      graphQlRequest = graphQlRequest.concat(`${request[1]}:"${request[2]}", `)
      if (request[3].to) {
        request[3].length = request[3].to + 1
        delete request[3].to
      }
      if (request[1].to) {
        request[1].length = request[1].to + 1
        delete request[1].to
      }
      _.forIn(request[3], (v, k) => {
        graphQlRequest = graphQlRequest.concat(`${k}:${v}, `)
      })
      graphQlRequest = graphQlRequest.concat('){')
    } else if (_.isObject(request[5])) {
      graphQlRequest = graphQlRequest.concat('(')
      graphQlRequest = graphQlRequest.concat(`${request[1]}:"${request[2]}", `)
      graphQlRequest = graphQlRequest.concat(`${request[3]}:"${request[4]}", `)
      if (request[5].to) {
        request[5].length = request[5].to + 1
        delete request[5].to
      }
      _.forIn(request[5], (v, k) => {
        graphQlRequest = graphQlRequest.concat(`${k}:${v}, `)
      })
      graphQlRequest = graphQlRequest.concat('){')
    }

    let subRequest = false

    _.forIn(_.slice(request, indexOfPagination + 1), (v, k) => {
      if (_.isObject(v) && !_.isArray(v)) {
        graphQlRequest = graphQlRequest.slice(0, -1)
        graphQlRequest = graphQlRequest.concat(`(`)
        if (v.to) {
          v.length = v.to + 1
          delete v.to
        }
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
