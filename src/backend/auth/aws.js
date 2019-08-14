'use strict';

function parseRawConfig({ aws: authConfig }) {
  let auth = authConfig;

  if (authConfig.access_key === undefined || authConfig.access_key === '') {
    auth.access_key = 'environment';
  }
  if (authConfig.secret_key === undefined || authConfig.secret_key === '') {
    auth.secret_key = 'environment';
  }
  if (authConfig.region === undefined || authConfig.region === '') {
    auth.region = 'environment';
  }

  return auth;
}

module.exports = { parseRawConfig };