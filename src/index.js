import fs from 'fs'
import jsYaml from 'js-yaml'
import astring from 'astring'

import { collectOptionValueMappingNodes, collectVariableNames } from './parser'
import { compileProgram } from './compiler'

export { OptionMapNode, lookupOptions, checkVariableRequirements } from './backend'

export function compileYaml(yamlFilename, outputFilename) {
  const yaml = jsYaml.load(fs.readFileSync(yamlFilename).toString())

  // TODO: validate yaml

  const variableNames = collectVariableNames(yaml.styles)
  const optionValueMappingNodes = collectOptionValueMappingNodes(yaml.values)

  const ast = compileProgram(variableNames, optionValueMappingNodes, yaml.styles)
  const code = astring(ast, {
    indent: '  ',
    lineEnd: '\n'
  })

  fs.writeFileSync(outputFilename, code)
}
