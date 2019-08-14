'use strict';

const auth = require('./auth');
const builder = require('./builder');

function fetch(backendList, requested) {
  if(backendList[requested] == undefined) {
    throw new Error('Backend not found');
  }

  return backendList[requested];
}

module.exports = { fetch, auth, builder };