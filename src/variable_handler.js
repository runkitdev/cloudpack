'use strict';

const { render } = require('micromustache');

function updateRuntimeVariables(config, output) {
  const scope = { runtime: output };
  const opts = { prefix: 'runtime', onMissing: 'skip' };
  return replaceEntry(config, { scope, opts });
}

function updateUserVariables(config, vars) {
  const scope = { var: vars };
  const opts = { prefix: 'var', onMissing: 'fail' };
  return replaceEntry(config, { scope, opts });
}

function replaceEntry(value, scope) {
  const type = typeof(value);

  if (type === 'string') {
    return replaceVariable(value, scope);
  } else if (type === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return recurseArr(value, scope);
    } else {
      return recurseObj(value, scope);
    }
  }
  return value;
}

function recurseObj(obj, scope) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: replaceEntry(obj[key], scope) };
  }, {});
}

function recurseArr(arr, scope) {
  return arr.map(value => replaceEntry(value, scope));
}

function replaceVariable(string, { scope, opts }) {
  if (string.indexOf('{{') === -1) return string;
  if (string.indexOf(opts.prefix + '.') === -1) return string;

  const newString = render(string, scope);
  if (newString === '') {
    if (opts.onMissing === 'fail') throw new Error(`Missing var: ${string}`);
    if (opts.onMissing === 'skip') return string;
  }

  return newString;
}

module.exports = { updateRuntimeVariables, updateUserVariables };