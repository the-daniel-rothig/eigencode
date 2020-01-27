const numeralRegex = /^[0-9]+$/
const separatorRegex = /[[\].]+/
const identifierRegex = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const quotedRegex = /(?:^"([^"\\]+)"$|^'([^'\\]+)'$)/;

const parse = name => name ? name.split(separatorRegex).filter(Boolean).map(x => {
  if (numeralRegex.test(x)) {
    return parseInt(x);
  }
  if (identifierRegex.test(x)) {
    return x;
  }
  if (quotedRegex.test(x)) {
    return x.match(quotedRegex)[1];
  }
  throw new Error(`unsupported key in ${name}: ${x}`);
}) : [];

export const combineObjectPaths = (outerName, name) => {
  const saneName = name || '';
  if (!outerName) {
    return saneName;
  }
  if (saneName.indexOf('[') === 0) {
    return outerName + saneName;
  }  
  return `${outerName}.${saneName}`;
}

export const deepSet = (object, name, value) => {
  if (value === undefined) {
    throw new Error('use deepDelete instead')
  }
  const levels = parse(name);
  
  let parent = object;
  for (var i = 0; i < levels.length - 1; i++) {
    const val = parent[levels[i]];
    if (val === null || val === undefined) {
      const shouldBeArray = typeof levels[i+1] === 'number';
      parent[levels[i]] = shouldBeArray ? [] : {};
    }
    if (typeof val !== 'object') {
      throw new Error(`${name}: tried to set property on ${levels[i]}, which is a non-object type`);
    }
    parent = parent[levels[i]]
  }

  if (value === undefined) {
    delete parent[levels[levels.length-1]]
  } else {
    parent[levels[levels.length-1]] = value
  }
  
  return object
}

export const deepDelete = (object, name) => {
  const levels = parse(name);
  
  let parent = object;
  for (var i = 0; i < levels.length - 1; i++) {
    const val = parent[levels[i]];
    if (val === null || val === undefined) {
      return object;
    }
    if (typeof val !== 'object') {
      throw new Error(`${name}: tried to delete property from ${levels[i]}, which is a non-object type`);
    }
    parent = parent[levels[i]]
  }

  const lastLevel = levels[levels.length-1];
  if (typeof lastLevel === 'number' && Array.isArray(parent)) {
    parent.splice(lastLevel, 1);
  } else {
    delete parent[levels[levels.length-1]]
  }

  return object
}

export const deepGet = (object, name) => {
  let val = object;
  parse(name).forEach(key => 
    val = val === null || val === undefined ? undefined : val[key]
  )
  return val;
}