export let OptionValueMapping = function(values, children) {
  this.values = values
  this.children = children
}

export let OptionValueMappingNode = function(name, mappings) {
  this.name = name
  this.mappings = mappings
}

const separateObjectKeys = (obj, keys) => {
  let newObj = {}
  keys.forEach((key) => newObj[key] = obj[key])
  return newObj
}

const optionMappingRegex = /^(\w+):\s*\w+$/

export function collectOptionValueMapping(obj) {
  const separateMappingsFromChildren = (obj) => {
    const subtractArrays = (a, b) => a.filter((v) => b.indexOf(v) < 0)

    const objKeys = Object.keys(obj)
    const childrenKeys = objKeys.filter((key) => key.search(optionMappingRegex) > -1)
    const mappingsKeys = subtractArrays(objKeys, childrenKeys)

    const children = separateObjectKeys(obj, childrenKeys)
    const mappings = separateObjectKeys(obj, mappingsKeys)

    return [mappings, children]
  }

  const [mappings, childrenObj] = separateMappingsFromChildren(obj)

  const children = collectOptionValueMappingNodes(childrenObj)
  return new OptionValueMapping(mappings, children)
}

export function collectOptionValueMappingNodes(obj) {
  const separateChildPairs = function(obj) {
    const uniqueArray = (arr) => {
      let newArr = []
      arr.forEach((element) => {
        if(newArr.indexOf(element) < 0) {
          newArr.push(element)
        }
      })

      return newArr
    }

    const objKeys = Object.keys(obj)

    const childMatches = objKeys.map((key) => key.match(optionMappingRegex))
    if(childMatches.some((match) => !match)) {
      throw new Error('Invalid option mapping key!')
    }

    const childNames = uniqueArray(childMatches.map((match) => match[1]))

    return childNames.map((name) => {
      const childKeys = objKeys.filter((key) => key.match(optionMappingRegex)[1] === name)
      const childObj = separateObjectKeys(obj, childKeys)
      return [name, childObj]
    })
  }

  const childPairs = separateChildPairs(obj)

  return childPairs.map(([name, childObj]) => {
    let mappings = {}

    Object.keys(childObj).forEach((key) => {
      const value = key.match(/^\w+:\s*(\w+)$/)[1]
      mappings[value] = collectOptionValueMapping(childObj[key])
    })

    return new OptionValueMappingNode(name, mappings)
  })
}

export function collectVariableNames(obj) {
  return Object.keys(obj).reduce((arr, key) => {
    const value = obj[key]

    if(typeof(value) === 'object') {
      return arr.concat(collectVariableNames(value))
    }

    const matches = value.match(/\${\w+}/g)
    if(matches) {
      const reformattedMatches = matches.map((match) => match.replace(/\${(\w+)}/, '$1'))
      return arr.concat(reformattedMatches)
    } else {
      return arr
    }
  }, [])
}
