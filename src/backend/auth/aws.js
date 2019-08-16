'use strict';

const EC2 = require('aws-sdk/clients/ec2');

function parseRawConfig(rawConfig) {
  if (rawConfig.auth === undefined || rawConfig.auth.aws === undefined)
    return null;

  const authConfig = rawConfig.auth.aws;
  let auth = authConfig;

  if (authConfig.access_key === undefined || authConfig.access_key === '')
    auth.access_key = 'environment';
  if (authConfig.secret_key === undefined || authConfig.secret_key === '')
    auth.secret_key = 'environment';
  if (authConfig.region === undefined || authConfig.region === '')
    auth.region = 'environment';

  return auth;
}

function getClientEC2(config) {
  const client = new EC2(getClientConfig(config.auth));

  if (client.config.region === undefined) {
    const note = `
    NOTE: AWS SDK for NodeJS fails to properly load the shared configuration
    file at \`~/.aws/config\`. Make sure to set the \`AWS_SDK_LOAD_CONFIG\` env
    var to a truthy value and all should be fine.\n
    Context: https://github.com/aws/aws-sdk-js/pull/1391\n`;

    throw new Error(`AWS region not found.\n${note}`);
  }

  return client;
}

function getClientConfig(auth) {
  let config = { apiVersion: '2016-11-15' };

  if (auth === null) return config;

  if (auth.region !== 'environment') config.region = auth.region;
  if (auth.access_key !== 'environment') config.access_key = auth.access_key;
  if (auth.secret_key !== 'environment') config.secret_key = auth.secret_key;

  return config;
}

module.exports = { name: 'aws', parseRawConfig, getClientEC2 };