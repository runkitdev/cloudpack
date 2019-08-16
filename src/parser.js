'use strict';

const fs = require('fs');
const backend = require('./backend');
const bootScript = require('./boot_script');
const variableHandler = require('./variable_handler');

function parse(configPath, cliOpts) {
  const rawConfig = getRawConfig(configPath, cliOpts);
  const backends = getBackends(rawConfig);

  let authConfig = null;
  if (backends.auth !== null)
    authConfig = backends.auth.parseRawConfig(rawConfig);

  let launchTemplateConfig = null;
  if (backends.launchTemplate !== null)
    launchTemplateConfig = backends.launchTemplate.parseRawConfig(rawConfig);

  const config = {
    cliOpts,
    backends,
    auth: authConfig,
    builder: backends.builder.parseRawConfig(rawConfig),
    build_script: parseBuildScript(rawConfig),
    boot_script: bootScript.parseRawConfig(rawConfig),
    launch_template: launchTemplateConfig
  };

  const output = {
    bootScript: null,
    packerTemplate: null,
    amiId: null,
    snapshotId: null,
    launchTemplateId: null
  };

  const status = {
    error: false
  };

  return { config, output, status };
}

function getRawConfig(configPath, cliOpts) {
  const rawConfig = readCloudpackConfig(configPath);

  performConfigSanityCheck(rawConfig);

  return formatConfig(rawConfig, cliOpts);
}

function getBackends(rawConfig) {
  const [authProvider] = Object.keys(rawConfig.auth || {});
  const [builderProvider] = Object.keys(rawConfig.builder);
  const [ltProvider] = Object.keys(rawConfig.launch_template || {});

  if (process.env.verbose) {
    console.log(`Auth backend: ${authProvider}`);
    console.log(`Builder backend: ${builderProvider}`);
    console.log(`LaunchTemplate backend: ${ltProvider}`);
  }

  return {
    auth: backend.fetchOptional(backend.auth, authProvider),
    builder: backend.fetchRequired(backend.builder, builderProvider),
    launchTemplate: backend.fetchOptional(backend.launchTemplate, ltProvider)
  };
}

function parseBuildScript(rawConfig) {
  if (rawConfig.build_script === undefined) return [];
  return rawConfig.build_script;
}

function readCloudpackConfig(path) {
  try {
    return JSON.parse(fs.readFileSync(path));
  } catch(e) {
    if (e instanceof SyntaxError) {
      console.log(e.message);
      throw new Error(`Error while parsing JSON at config file "${path}"`);
    } else {
      throw new Error(`Could not read config file at "${path}".`);
    }
  }
}

function performConfigSanityCheck(rawConfig) {
  if (rawConfig.builder === undefined)
    throw new Error('Missing `builder` section on cloudpack config.');
}

function formatConfig(rawConfig, { vars }) {
  return variableHandler.updateUserVariables(rawConfig, vars);
}

module.exports = { parse };