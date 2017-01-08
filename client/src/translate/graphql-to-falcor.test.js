import test from 'tape'
import assert from 'assert'
import {translateNode} from './graphql-to-falcor'

test('simple document', t => {
  assert.deepEqual(
    translateNode({
      kind: 'Document',
      definitions: [
        {
          kind: 'OperationDefinition',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{kind: 'Field', name: {value: 'field'}}]
          }
        }
      ]
    }),
    [['field']])
  t.end()
})

test('simple field', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}}),
    [['field']])
  t.end()
})

test('simple field with one argument', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}, arguments: [
      {name: {value: 'arg'}, value: {value: 'argValue'}}
    ]}),
    [['field', 'arg', 'argValue']])
  t.end()
})

test('simple field with several argument', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}, arguments: [
      {name: {value: 'arg'}, value: {value: 'argValue'}},
      {name: {value: 'arg'}, value: {value: 'argValue'}},
      {name: {value: 'arg'}, value: {value: 'argValue'}}
    ]}),
    [['field', 'arg', 'argValue', 'arg', 'argValue', 'arg', 'argValue']])
  t.end()
})

test('simple field with one range argument', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}, arguments: [
      {name: {value: 'from'}, value: {value: 0}},
      {name: {value: 'length'}, value: {value: 10}}
    ]}),
    [['field', {from: 0, length: 10}]])
  t.end()
})

test('simple field with one range argument and one normal argument', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}, arguments: [
      {name: {value: 'from'}, value: {value: 0}},
      {name: {value: 'length'}, value: {value: 10}},
      {name: {value: 'arg'}, value: {value: 'argValue'}}
    ]}),
    [['field', 'arg', 'argValue', {from: 0, length: 10}]])
  t.end()
})

test('fields with two selections', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}, selectionSet: {
      kind: 'SelectionSet',
      selections: [
        {kind: 'Field', name: {value: 'child1'}},
        {kind: 'Field', name: {value: 'child2'}}
      ]
    }}),
    [['field', 'child1'], ['field', 'child2']]
  )
  t.end()
})

test('fields with nested selection', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}, selectionSet: {
      kind: 'SelectionSet',
      selections: [
        {kind: 'Field', name: {value: 'child1'}, selectionSet: {
          kind: 'SelectionSet',
          selections: [
            {kind: 'Field', name: {value: 'child2'}}
          ]
        }}
      ]
    }}),
    [['field', 'child1', 'child2']]
  )
  t.end()
})

test('fields with a nested selection and a simple selection before', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}, selectionSet: {
      kind: 'SelectionSet',
      selections: [
        {kind: 'Field', name: {value: 'child3'}},
        {kind: 'Field', name: {value: 'child1'}, selectionSet: {
          kind: 'SelectionSet',
          selections: [
            {kind: 'Field', name: {value: 'child2'}}
          ]
        }}
      ]
    }}),
    [['field', 'child3'], ['field', 'child1', 'child2']]
  )
  t.end()
})

test('fields with a nested selection and a simple selection after', t => {
  assert.deepEqual(
    translateNode({kind: 'Field', name: {value: 'field'}, selectionSet: {
      kind: 'SelectionSet',
      selections: [
        {kind: 'Field', name: {value: 'child1'}, selectionSet: {
          kind: 'SelectionSet',
          selections: [
            {kind: 'Field', name: {value: 'child2'}}
          ]
        }},
        {kind: 'Field', name: {value: 'child3'}}
      ]
    }}),
    [['field', 'child1', 'child2'], ['field', 'child3']]
  )
  t.end()
})
