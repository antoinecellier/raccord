import {parse} from 'graphql/language/parser'
import { print } from 'graphql/language/printer'
import _ from 'lodash'
import falcorPathSyntax from 'falcor-path-syntax'
import falcorPathUtils from 'falcor-path-utils'
import fetch from 'isomorphic-fetch'

export default function translate (inputFalcor) {
  const parsedInputFalcor = inputFalcor.map(path => typeof path === 'string' ? falcorPathSyntax(path) : path)
  const collapsedInputFalcor = falcorPathUtils.collapse(parsedInputFalcor)
  return getSchema().then(typesOfArgsByField).then(schema => {
    console.log('Falcor->GraphQL: translating path:', collapsedInputFalcor, schema)
    const outputGraphQlAst = wrapInQuery(collapseSelections(collapsedInputFalcor
      .map(path => translatePath(path, schema))
      .reduce((all, selections) => all.concat(selections))))
    console.log('Falcor->GraphQL: translation output:', outputGraphQlAst)
    return print(outputGraphQlAst)
  })
}

/**
 * Wraps a GraphQL selections array into a GraphQL query.
 */
function wrapInQuery (selections) {
  return {
    kind: 'Document',
    definitions: [
      {
        kind: 'OperationDefinition',
        operation: 'query',
        selectionSet: {
          kind: 'SelectionSet',
          selections
        }
      }
    ]
  }
}

export function collapseSelections (selections) {
  return _(selections)
    .groupBy(selection => selection.name.value + _.map(selection.arguments, arg => arg.name.value + arg.value.value).join(''))
    .map(group => _.mergeWith(...group, (left, right, key) => {
      if (key === 'selections') return collapseSelections(left.concat(right))
    }))
    .value()
}

/**
 * Translate a falcor path to a GraphQL selections array.
 */
export function translatePath (path, schema) {
  return translateArgAwarePath(groupArgs(path, schema))
}

/**
 * Translates a path returned by groupArgs to a GraphQL selections array.
 */
function translateArgAwarePath (path) {
  if (path.length === 0) return []
  const [{field, args}, ...rest] = path
  const fields = Array.isArray(field) ? field : [field]
  return fields.map(field => {
    const gqlNode = {
      kind: 'Field',
      name: {
        kind: 'Name',
        value: field
      },
      arguments: _.map(args, ({value, type}, name) => ({
        kind: 'Argument',
        name: {kind: 'Name', value: name},
        value: {kind: `${type}Value`, value}
      })),
      selectionSet: {
        kind: 'SelectionSet',
        selections: translateArgAwarePath(rest)
      }
    }
    if (_.isEmpty(gqlNode.arguments)) delete gqlNode.arguments
    if (_.isEmpty(gqlNode.selectionSet.selections)) delete gqlNode.selectionSet
    return gqlNode
  })
}

/**
 * Returns a simplified schema to pass to groupArgs.
 */
export function typesOfArgsByField (schema = {}) {
  // TODO: handle fields with same name (i.e. namespace by types)
  return _(schema.types).flatMap('fields').compact().transform((nodes, node) => {
    nodes[node.name] = _.transform(node.args, (args, arg) => {
      args[arg.name] = arg.type.name || arg.type.ofType.name
    }, {})
  }, {}).value()
}

/**
 * Groups fields with their arguments. Uses the GraphQL schema to detect
 * arguments.
 *
 * @argument path falcor path
 * @argument schema output from typesOfArgsByField
 */
export function groupArgs (path, schema = {}) {
  if (path.length === 0) return []
  const [field, ...maybeArgs] = path
  const args = _(maybeArgs)
    .chunk(2)
    .takeWhile(([name]) => name in (schema[field] || {}))
    .fromPairs()
    .mapValues((value, name) => ({value: value || '', type: schema[field][name]}))
    .value()
  const restOfPath = _.drop(maybeArgs, Object.keys(args).length * 2)
  return [{field, args}, ...groupArgs(restOfPath, schema)]
}

function getSchema () {
  if (getSchema.schema) return getSchema.schema
  getSchema.schema = fetch('http://127.0.0.1:7080/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({query: `{
      __schema {
        types {
          name
          fields {
            name
            args {
              name
              type {
                name
                ofType {
                  name
                }
              }
            }
          }
        }
      }
    }`})
  })
  .then(response => response.json())
  .then(response => response.data.__schema)
  return getSchema.schema
}
