import test from 'tape'
import {translatePath, chunkByArgs} from './falcor-to-graphql'

test('one path with 1 simple segments', {objectPrintDepth: 20}, t => {
  t.deepEqual(
    translatePath(['field']),
    {
      kind: 'Document',
      definitions: [
        {
          kind: 'OperationDefinition',
          operation: 'query',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{kind: 'Field', name: {kind: 'Name', value: 'field'}}]
          }
        }
      ]
    })
  t.end()
})

test('one path with 2 simple segments', {objectPrintDepth: 20}, t => {
  t.deepEqual(
    translatePath(['field1', 'field2']),
    {
      kind: 'Document',
      definitions: [
        {
          kind: 'OperationDefinition',
          operation: 'query',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              {
                kind: 'Field',
                name: {kind: 'Name', value: 'field1'},
                selectionSet: {
                  kind: 'SelectionSet',
                  selections: [
                    {kind: 'Field', name: {kind: 'Name', value: 'field2'}}
                  ]
                }
              }
            ]
          }
        }
      ]
    })
  t.end()
})

test('one path with 1 simple segments and 1 nested segment at the end', {objectPrintDepth: 20}, t => {
  t.deepEqual(
    translatePath(['field1', ['child1', 'child2']]),
    {
      kind: 'Document',
      definitions: [
        {
          kind: 'OperationDefinition',
          operation: 'query',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              {
                kind: 'Field',
                name: {kind: 'Name', value: 'field1'},
                selectionSet: {
                  kind: 'SelectionSet',
                  selections: [
                    {kind: 'Field', name: {kind: 'Name', value: 'child1'}},
                    {kind: 'Field', name: {kind: 'Name', value: 'child2'}}
                  ]
                }
              }
            ]
          }
        }
      ]
    })
  t.end()
})

test('args processing', t => {
  t.deepEqual(
    chunkByArgs(['a', 'b', 'c', 'd', ['e', 'f']], {types: [{fields: [{name: 'a', args: [{name: 'b', type: {name: 'String'}}]}]}]}),
    [{kind: 'FieldWithArgs', field: 'a', args: {b: {name: 'c', type: 'String'}}}, {kind: 'Field', field: 'd'}, {kind: 'MultipleFields', fields: ['e', 'f']}])
  t.end()
})
