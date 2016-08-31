export function OptionMapNode(direct, nested) {
  this.direct = direct
  this.nested = nested
}

export function lookupOptions(optionValues, map) {
  let variables = {}

  const addVariableValues = function(obj) {
    Object.keys(obj).forEach((key) => {
      if(key in variables) {
        throw new Error(`Variable ${key} set twice!`)
      }

      variables[key] = obj[key]
    })
  }

  Object.keys(optionValues).forEach((optionName) => {
    if(!(optionName in map)) {
      throw new Error(`Invalid option passed: ${optionName}`)
    }

    const optionValue = optionValues[optionName]
    const node = map[optionName]

    if(optionValue in node.direct) {
      addVariableValues(node.direct[optionValue])
    }

    if(optionValue in node.nested) {
      addVariableValues(lookupOptions(optionValues, node.nested[optionValue]))
    }
  })

  return variables
}

export function checkVariableRequirements(variables, requirements) {
  requirements.forEach((requirement) => {
    if(!(requirement in variables)) {
      throw new Error(`Options did not instantiate template variable: ${requirement}`)
    }
  })
}
