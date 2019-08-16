'use strict';

const util = require('util');
const fs = require('fs');

const unlink = util.promisify(fs.unlink);
const defaultRcLocalPath = '/etc/rc.local';

function generateProvisioners(bootScript, config) {
  const filePath = getBootFilePath(config.cliOpts.tmpPath);
  const destPath = config.boot_script.rc_local_path || defaultRcLocalPath;

  writeBootFile(filePath, bootScript);

  return [
    { type: 'file', source: filePath, destination: destPath },
    { type: 'shell', inline: [`chmod +x ${destPath}`] }
  ];
}

function writeBootFile(filePath, bootScript) {
  fs.writeFileSync(filePath, bootScript, { mode: 0o600 });
  if (process.env.verbose) console.log(`Boot script written to ${filePath}`);
}

async function cleanUpBootFile({ cliOpts }) {
  try {
    const filePath = getBootFilePath(cliOpts.tmpPath);
    await unlink(filePath);

    if (process.env.verbose)
      console.log(`Generated boot file deleted from ${filePath}`);
  } catch(e) {
    console.log('Error while cleaning up generated boot file...');
  }
}

function getBootFilePath(tmpPath) {
  return tmpPath + '/cloudpack_tmp_boot_file.sh';
}

module.exports = { generateProvisioners, cleanUpBootFile };