import test from 'tape'
import {GraphQLSchema} from 'graphql/type'
import {buildSchema} from 'graphql/utilities'
import {translatePath, groupArgs, collapseSelections, aliasSelections} from './falcor-to-graphql'

test('path with 1 simple segments', {objectPrintDepth: 20}, t => {
  t.deepEqual(
    translatePath(['field']),
    [
      {
        kind: 'Field',
        name: {
          kind: 'Name',
          value: 'field'
        }
      }
    ]
  )
  t.end()
})

test('path with 2 simple segments', {objectPrintDepth: 20}, t => {
  t.deepEqual(
    translatePath(['field1', 'field2']),
    [
      {
        kind: 'Field',
        name: {
          kind: 'Name',
          value: 'field1'
        },
        selectionSet: {
          kind: 'SelectionSet',
          selections: [
            {
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'field2'
              }
            }
          ]
        }
      }
    ]
  )
  t.end()
})

test('path with 1 simple segments and 1 nested segment at the end', {objectPrintDepth: 20}, t => {
  t.deepEqual(
    translatePath(['field1', ['child1', 'child2']]),
    [
      {
        kind: 'Field',
        name: {
          kind: 'Name',
          value: 'field1'
        },
        selectionSet: {
          kind: 'SelectionSet',
          selections: [
            {
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'child1'
              }
            },
            {
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'child2'
              }
            }
          ]
        }
      }
    ]
  )
  t.end()
})

test('path with range', {objectPrintDepth: 20}, t => {
  t.deepEqual(
    translatePath(
      ['field1', {from: 0, to: 9}, 'field2'],
      buildSchema(`
        type Query {
          field1(from: Int, length: Int): Query
        }
      `)
    ),
    [
      {
        kind: 'Field',
        name: {
          kind: 'Name',
          value: 'field1'
        },
        arguments: [
          {
            kind: 'Argument',
            name: {
              kind: 'Name',
              value: 'from'
            },
            value: {
              kind: 'IntValue',
              value: 0
            }
          },
          {
            kind: 'Argument',
            name: {
              kind: 'Name',
              value: 'length'
            },
            value: {
              kind: 'IntValue',
              value: 10
            }
          }
        ],
        selectionSet: {
          kind: 'SelectionSet',
          selections: [
            {
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'field2'
              }
            }
          ]
        }
      }
    ]
  )
  t.end()
})

test('args processing', t => {
  t.deepEqual(
    // Actual
    groupArgs(
      // Falcor path
      ['a', 'b', 'c', 'd', ['e', 'f']],
      // Root type
      'Query',
      // GraphQL schema
      buildSchema(`
        type Query {
          a(b: String): OtherType
        }
        type OtherType {
          a: Query
          b: Query
          c: OtherType
          d: OtherType
          e: OtherType
          f: OtherType
        }
      `)
    ),
    // Expected chunked path
    [
      {
        field: 'a',
        args: {
          b: {value: 'c', type: 'String'}
        }
      },
      {
        field: 'd',
        args: {}
      },
      {
        field: ['e', 'f'],
        args: {}
      }
    ]
  )
  t.end()
})

test('args processing: range support', t => {
  t.deepEqual(
    // Actual
    groupArgs(
      // Falcor path
      ['a', {from: 0, to: 9}, 'a'],
      // Root type
      'Query',
      // GraphQL schema
      buildSchema(`
        type Query {
          a(from: Int, length: Int): [Query]
        }
      `)
    ),
    // Expected chunked path
    [
      {
        field: 'a',
        args: {from: {type: 'Int', value: 0}, length: {type: 'Int', value: 10}}
      },
      {
        field: 'a',
        args: {}
      }
    ]
  )
  t.end()
})

test('selection collapsing', t => {
  t.deepEqual(
    collapseSelections([
      {name: {value: 'a'}, selectionSet: {selections: [{name: {value: 'b'}}]}},
      {name: {value: 'a'}, selectionSet: {selections: [{name: {value: 'c'}}]}}
    ]),
    [{name: {value: 'a'}, selectionSet: {selections: [{name: {value: 'b'}}, {name: {value: 'c'}}]}}]
  )
  t.end()
})

test('selection aliasing: should alias', t => {
  const [first, second] = aliasSelections([
    {name: {value: 'a'}, arguments: [{name: {value: 'x'}, value: {value: 'x'}}], selectionSet: {selections: [{name: {value: 'b'}}]}},
    {name: {value: 'a'}, arguments: [{name: {value: 'x'}, value: {value: 'y'}}], selectionSet: {selections: [{name: {value: 'b'}}]}}
  ])
  t.assert(first.alias.value)
  t.assert(second.alias.value)
  t.notEqual(first.alias.value, second.alias.value)
  t.end()
})

test('selection aliasing: should not alias', t => {
  const [first, second] = aliasSelections([
    {name: {value: 'a'}},
    {name: {value: 'b'}}
  ])
  t.notOk(first.alias)
  t.notOk(second.alias)
  t.end()
})
