import { OptionMapNode, lookupOptions, checkVariableRequirements } from 'daidala/backend'

const variableNames = ['backgroundColor', 'bxoShadowColor']

const optionMap = {
  action: new OptionMapNode({}, {
    alert: {
      contrast: new OptionMapNode({
        light: {
          backgroundColor: 'asdf',
          boxShadowColor: '123'
        },
        dark: {
          backgroundColor: 'asdfasdf',
          boxShadowColor: '123213'
        }
      }, {})
    }
  })
}

const unpackCss = function(variables) {
  const {
    backgroundColor,
    boxShadowColor
  } = variables

  return {
    backgroundColor: `${backgroundColor}`,
    boxShadowColor: `${boxShadowColor}`
  }
}

export default function(options) {
  const variables = lookupOptions(options, optionMap)
  checkVariableRequirements(variables, variableNames)
  unpackCss(variables)
}
