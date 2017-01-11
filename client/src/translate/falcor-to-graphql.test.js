import test from 'tape'
import {translatePath, groupArgs, schemaKeyedByNames, collapseSelections} from './falcor-to-graphql'

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
      {
        Query: {
          fields: {
            field1: {
              args: {
                from: {
                  type: {
                    name: 'Int'
                  }
                },
                length: {
                  type: {
                    name: 'Int'
                  }
                }
              },
              type: {
                name: 'Query'
              }
            }
          }
        }
      }
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

test('schema processing', t => {
  t.deepEqual(
    schemaKeyedByNames({
      types: [
        {
          name: 't',
          fields: [
            {
              name: 'a',
              args: [
                {
                  name: 'b',
                  type: {name: 'String'}
                }
              ]
            }
          ]
        }
      ]
    }),
    {
      t: {
        name: 't',
        fields: {
          a: {
            name: 'a',
            args: {
              b: {
                name: 'b',
                type: {name: 'String'}
              }
            }
          }
        }
      }
    }
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
      'TypeA',
      // GraphQL fields
      {
        TypeA: {
          fields: {
            a: {
              type: {
                name: 'TypeB'
              },
              args: {
                b: {
                  type: {name: 'String'}
                }
              }
            }
          }
        },
        TypeB: {
          fields: {
            a: {type: {name: 'TypeA'}, args: {}},
            b: {type: {name: 'TypeA'}, args: {}},
            c: {type: {name: 'TypeB'}, args: {}},
            d: {type: {name: 'TypeB'}, args: {}},
            e: {type: {name: 'TypeB'}, args: {}},
            f: {type: {name: 'TypeB'}, args: {}}
          }
        }
      }
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
      'TypeA',
      // GraphQL fields
      {
        TypeA: {
          fields: {
            a: {
              args: {
                from: {
                  type: {
                    name: 'Int'
                  }
                },
                length: {
                  type: {
                    name: 'Int'
                  }
                }
              },
              type: {
                name: null,
                kind: 'LIST',
                ofType: {
                  name: 'TypeA'
                }
              }
            }
          }
        }
      }
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
