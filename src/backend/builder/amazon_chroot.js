'use strict';

function parseRawConfig({ builder: builderRawConfig }) {
  const amazonChrootConfig = builderRawConfig['amazon-chroot'];

  const acKeys = Object.keys(amazonChrootConfig);
  if (! acKeys.includes('ami_name'))
    throw new Error('I really need `ami_name` on the builder configuration.');

  return amazonChrootConfig;
}

function configureBuilder(config) {
  const extraEntries = {
    type: 'amazon-chroot'
  };

  const credentials = getBuilderCredentials(config);

  return { ...config.builder, ...extraEntries, ...credentials };
}

function parseBuildResult({ stdout }) {
  const stdoutArray = stdout.split('\n');
  const { amiId, snapshotId } = findCreatedResources(stdoutArray);

  if (amiId === null || snapshotId === null) {
    let errorMsg = 'Failed during Packer build.';
    if (! process.env.verbose)
      errorMsg = errorMsg.concat(` Packer output: \n\n\n${stdout}`);
    if (snapshotId !== null)
      errorMsg = errorMsg.concat('\n\n[WARNING]: Dangling resources detected');

    return { success: false, errorMsg };
  }

  return { success: true, resources: { amiId, snapshotId } };
}

function findCreatedResources(stdoutArray) {
  return stdoutArray.reduce((acc, stdoutLine) => {
    if (acc.snapshotId === null)
      acc.snapshotId = getSnapshotIdOnLine(stdoutLine);
    if (acc.amiId === null)
      acc.amiId = getAmiIdOnLine(stdoutLine);

    return acc;
  }, { snapshotId: null, amiId: null });
}

function getSnapshotIdOnLine(stdoutLine) {
  if (stdoutLine.indexOf('Snapshot ID: snap-') === -1) return null;
  return stdoutLine.slice(stdoutLine.indexOf('snap-'));
}

function getAmiIdOnLine(stdoutLine) {
  if (stdoutLine.indexOf('AMI: ami-') === -1) return null;
  return stdoutLine.slice(stdoutLine.indexOf('ami-'));
}

function getRelevantOutput(output) {
  return { amiId: output.amiId, snapshotId: output.snapshotId };
}

function getBuilderCredentials(config) {
  let creds = {};

  // Auth may not be defined, in which case we assume user has creds on env/file
  if (config.auth === null) return creds;

  if (config.auth.access_key !== 'environment')
    creds.access_key = config.auth.access_key;
  if (config.auth.secret_key !== 'environment')
    creds.secret_key = config.auth.secret_key;

  return creds;
}

module.exports = { 
  name: 'amazon-chroot',
  parseRawConfig,
  configureBuilder,
  parseBuildResult,
  getRelevantOutput
};