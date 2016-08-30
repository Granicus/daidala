import fs from 'fs'
import jsYaml from 'js-yaml'
import astring from 'astring'

import * as parser from 'parser'

import { collectOptionValueMappingNodes, collectVariableNames } from 'parser'
import { compileProgram } from 'compiler'

const testYamlString = fs.readFileSync('test.yml').toString()
const yaml = jsYaml.load(testYamlString)

// TODO: validate yaml

const variableNames = collectVariableNames(yaml.styles)
const optionValueMappingNodes = collectOptionValueMappingNodes(yaml.values)

const ast = compileProgram(variableNames, optionValueMappingNodes, yaml.styles)

console.log(astring(ast, {
  indent: '  ',
  lineEnd: '\n'
}))
