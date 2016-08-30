import { OptionMapNode } from 'backend'

const backendImportDeclaration = {
  type: 'ImportDeclaration',
  specifiers: [
    {
      type: 'ImportSpecifier',
      imported: {
        type: 'Identifier',
        name: 'OptionMapNode'
      },
      local: {
        type: 'Identifier',
        name: 'OptionMapNode'
      }
    },
    {
      type: 'ImportSpecifier',
      imported: {
        type: 'Identifier',
        name: 'lookupOptions'
      },
      local: {
        type: 'Identifier',
        name: 'lookupOptions'
      }
    },
    {
      type: 'ImportSpecifier',
      imported: {
        type: 'Identifier',
        name: 'checkVariableRequirements'
      },
      local: {
        type: 'Identifier',
        name: 'checkVariableRequirements'
      }
    }
  ],
  source: {
    type: 'Literal',
    value: 'daidala/backend',
    raw: '\"daidala/backend\"'
  }
}

const exportedFunctionExpression = {
  type: 'FunctionExpression',
  id: null,
  generator: false,
  expression: false,
  params: [
    {
      type: 'Identifier',
      name: 'obj'
    }
  ],
  body: {
    type: 'BlockStatement',
    body: [
      {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'variables'
            },
            init: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'lookupOptions'
              },
              arguments: [
                {
                  type: 'Identifier',
                  name: 'options'
                },
                {
                  type: 'Identifier',
                  name: 'optionsMap'
                }
              ]
            }
          }
        ]
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'checkVariableRequirements'
          },
          arguments: [
            {
              type: 'Identifier',
              name: 'variables'
            },
            {
              type: 'Identifier',
              name: 'variableNames'
            }
          ]
        }
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'unpackCss'
          },
          arguments: [
            {
              type: 'Identifier',
              name: 'variables'
            }
          ]
        }
      }
    ]
  }
}

const compileJsObject = function(obj) {
  const properties = Object.keys(obj).map((key) => {
    const value = obj[key]

    let propertyValue

    if(value.__proto__ === OptionMapNode.prototype) {
      propertyValue = {
        type: 'NewExpression',
        callee: {
          type: 'Identifier',
          name: 'OptionMapNode'
        },
        arguments: [
          compileJsObject(value.direct),
          compileJsObject(value.nested)
        ]
      }
    } else if(typeof(value) === 'string') {
      propertyValue = {
        type: 'Literal',
        value,
        raw: `\"${value}\"`
      }
    } else if(typeof(value) === 'object') {
      propertyValue = compileJsObject(value)
    } else {
      throw new Error(`Cannot compile js object value: ${value}`)
    }

    return {
      type: 'Property',
      method: false,
      shorthand: false,
      computed: false,
      kind: 'init',
      key: {
        type: 'Identifier',
        name: key
      },
      value: propertyValue
    }
  })

  return {
    type: 'ObjectExpression',
    properties
  }
}

const compileJsArray = function(arr) {
  const elements = arr.map((element) => ({
    type: 'Literal',
    value: element,
    raw: `\"element\"`
  }))

  return {
    type: 'ArrayExpression',
    elements
  }
}

const compileJsString = function(str) {
  const collectUsedVariables = (template) =>
    template.match(/\${\w+}/g).map((match) => match.replace(/\${(\w+)}/, '$1'))

  const splitTemplateString = (template) => {
    const matches = /\${\w+}/.exec(template)
    if(matches) {
      const literalPortion = template.slice(0, matches.index)
      const nextPortion = template.slice(matches.index + matches[0].length)
      return [literalPortion].concat(splitTemplateString(nextPortion))
    } else {
      return [template]
    }
  }

  if(/\${\w+}/.test(str)) {
    const usedVariables = collectUsedVariables(str)
    const ids = usedVariables.map((usedVariable) => ({
      type: 'Identifier',
      name: usedVariable
    }))

    const templateSections = splitTemplateString(str)
    const quasis = templateSections.map((section) => ({
      type: 'TemplateElement',
      value: {
        raw: section,
        cooked: section
      },
      tail: false
    }))

    quasis[quasis.length - 1].tail = true

    return {
      type: 'TemplateLiteral',
      expressions: ids,
      quasis
    }
  } else {
    return {
      type: 'Literal',
      value: str,
      raw: `\"${str}\"`
    }
  }
}

const wrapVariableDeclaration = function(name, init) {
  return {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name
        },
        init
      }
    ]
  }
}

const compileOptionMapFromOptionValueMappingNodes = function(nodes) {
  let obj = {}

  nodes.forEach((node) => {
    let direct = {}
    let nested = {}

    Object.keys(node.mappings).forEach((key) => {
      direct[key] = node.mappings[key].values
      nested[key] = compileOptionMapFromOptionValueMappingNodes(node.mappings[key].children)
    })

    obj[node.name] = new OptionMapNode(direct, nested)
  })

  return obj
}

const compileStylesObjectExpression = function(styles) {
  const properties = Object.keys(styles).map((key) => {
    let value
    const style = styles[key]

    if(typeof(style) === 'object') {
      value = compileStylesObjectExpression(style)
    } else if(typeof(style) === 'string') {
      value = compileJsString(style)
    } else {
      throw new Error(`Invalid style field value: ${value}`)
    }

    return {
      type: 'Property',
      method: false,
      shorthand: false,
      computed: false,
      key: {
        type: 'Literal',
        value: key,
        raw: `\"${key}\"`
      },
      kind: 'init',
      value
    }
  })

  return {
    type: 'ObjectExpression',
    properties
  }
}

const compileUnpackCssFunction = function(variableNames, styles) {
  const variableDestructuringProperties = variableNames.map((variableName) => ({
    type: 'Property',
    method: false,
    shorthand: true,
    computed: false,
    key: {
      type: 'Identifier',
      name: variableName
    },
    kind: 'init',
    value: {
      type: 'Identifier',
      name: variableName
    }
  }))

  const variableDestructuringDeclaration = {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: {
          type: 'ObjectPattern',
          properties: variableDestructuringProperties
        },
        init: {
          type: 'Identifier',
          name: 'variables'
        }
      }
    ]
  }

  const stylesObjectExpression = compileStylesObjectExpression(styles)

  return {
    type: 'FunctionExpression',
    params: [
      {
        type: 'Identifier',
        name: 'variables'
      }
    ],
    body: {
      type: 'BlockStatement',
      body: [
        variableDestructuringDeclaration,
        {
          type: 'ReturnStatement',
          argument: stylesObjectExpression
        }
      ]
    }
  }
}

export function compileProgram(names, nodes, styles) {
  const optionNamesArrayExp = compileJsArray(names)
  const optionNamesVariableDeclaration = wrapVariableDeclaration('optionNames', optionNamesArrayExp)

  const optionMap = compileOptionMapFromOptionValueMappingNodes(nodes)
  const optionMapObjectExp = compileJsObject(optionMap)
  const optionMapVariableDeclaration = wrapVariableDeclaration('optionMap', optionMapObjectExp)

  const unpackCssFunctionExp = compileUnpackCssFunction(names, styles)
  const unpackCssVariableDeclaration = wrapVariableDeclaration('unpackCss', unpackCssFunctionExp)

  return {
    type: 'Program',
    body: [
      backendImportDeclaration,
      optionNamesVariableDeclaration,
      optionMapVariableDeclaration,
      unpackCssVariableDeclaration,
      {
        type: 'ExportDefaultDeclaration',
        declaration: exportedFunctionExpression
      }
    ]
  }
}
