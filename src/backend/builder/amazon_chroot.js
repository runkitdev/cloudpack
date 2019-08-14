'use strict';

function parseRawConfig({ 'amazon-chroot': builderRawConfig }) {
  return builderRawConfig;
}

function configureBuilder(config) {
  const extraEntries = {
    type: 'amazon-chroot'
  };

  const credentials = getBuilderCredentials(config);

  return { ...config.builder, ...extraEntries, ...credentials };
}

function parseBuildResult({ stdout }) {
  // TODO: Wrong
  const stdoutArray = stdout.split('\n').slice(0, -1);
  const lastEntry = stdoutArray.pop();

  const amiIndex = lastEntry.indexOf('ami-', -2);
  if (amiIndex !== -1) {
    const amiId = lastEntry.slice(amiIndex, -2);
    const snapshotId = findSnapshotId(stdoutArray);

    return { success: true, resources: { amiId, snapshotId } };
  }

  let errorMsg = 'Failed during Packer build.';
  if (! process.env.verbose) {
    errorMsg = errorMsg.concat(` Packer output: \n\n\n ${stdout}`);
  }

  return { success: false, errorMsg };
}

function getRelevantOutput(output) {
  return { amiId: output.amiId, snapshotId: output.snapshotId };
}

function getBuilderCredentials(config) {
  let creds = {};

  if (config.auth.access_key !== 'environment')
    creds.access_key = config.auth.access_key;
  if (config.auth.secret_key !== 'environment')
    creds.secret_key = config.auth.secret_key;

  return creds;
}

function findSnapshotId(stdoutArray) {
  return stdoutArray.reduce((acc, stdoutLine) => {
    if (stdoutLine.indexOf('Snapshot ID: snap-') === -1) return acc;
    return stdoutLine.slice(stdoutLine.indexOf('snap-'));
  });
}

module.exports = { 
  parseRawConfig,
  configureBuilder,
  parseBuildResult,
  getRelevantOutput
};