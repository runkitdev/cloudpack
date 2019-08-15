'use strict';

const auth = require('./auth');
const builder = require('./builder');
const launchTemplate = require('./launch_template');

function fetchRequired(backendList, requested) {
  const backend = fetchOptional(backendList, requested);

  if(backend === null) {
    throw new Error(`Backend "${requested}" not found`);
  }

  return backend;
}

function fetchOptional(backendList, requested) {
  return backendList[requested] || null;
}

module.exports = {
  fetchRequired,
  fetchOptional,
  auth,
  builder,
  launchTemplate
};