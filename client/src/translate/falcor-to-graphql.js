import _ from 'lodash'
import falcorPathSyntax from 'falcor-path-syntax'
import falcorPathUtils from 'falcor-path-utils'
import fetch from 'isomorphic-fetch'
import {print} from 'graphql/language/printer'
import {buildClientSchema, introspectionQuery} from 'graphql/utilities'
import {getNamedType} from 'graphql/type'

export default function translate (inputFalcor) {
  const parsedInputFalcor = inputFalcor.map(path => typeof path === 'string' ? falcorPathSyntax(path) : path)
  const collapsedInputFalcor = falcorPathUtils.collapse(parsedInputFalcor)
  return getSchema().then(schema => {
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
  return translateArgAwarePath(groupArgs(path, 'Query', schema))
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
 * Groups fields with their arguments. Uses the GraphQL schema to detect
 * arguments.
 *
 * @argument path falcor path
 * @argument schema output from schemaKeyedByNames
 */
export function groupArgs (path, type, schema) {
  if (path.length === 0) return []
  let rangeWasExpanded = false // CAREFUL: mutated by inner function rangeToArgs
  const [field, ...maybeArgs] = path
  const fieldSchema = schema && schema.getType(type).getFields()[field] || {args: {}, type: {name: type}}
  const args = _(maybeArgs)
    .flatMap(maybeArg => _.isPlainObject(maybeArg) ? rangeToArgs(maybeArg) : [maybeArg])
    .chunk(2)
    .takeWhile(([name]) => _.some(fieldSchema.args, {name}))
    .fromPairs()
    .mapValues((value, name) => ({value: _.isNil(value) ? '' : value, type: typeOf(_.find(fieldSchema.args, {name}))}))
    .value()
  const numberOfPathSegmentTakenByArgs = (Object.keys(args).length * 2) - (3 * +rangeWasExpanded)
  const restOfPath = _.drop(maybeArgs, numberOfPathSegmentTakenByArgs)
  const typeOfRestOfPath = typeOf(fieldSchema)
  return [{field, args}, ...groupArgs(restOfPath, typeOfRestOfPath, schema)]

  function typeOf ({type}) {
    return getNamedType(type).name
  }

  function rangeToArgs ({from = 0, to = 1, length}) {
    rangeWasExpanded = true
    if (!length) length = to + 1
    return ['from', from, 'length', length]
  }
}

function getSchema () {
  if (getSchema.schema) return getSchema.schema
  getSchema.schema = fetch('http://127.0.0.1:7080/graphql', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query: introspectionQuery})
  })
  .then(response => response.json())
  .then(response => buildClientSchema(response.data))
  return getSchema.schema
}
