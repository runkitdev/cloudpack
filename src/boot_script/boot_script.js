'use strict';

const defaultShebang = '#!/usr/bin/env bash';
const allowedTypes = ['rc.local'];

function parseRawConfig(rawConfig) {
  if (rawConfig.boot_script === undefined) return null;

  const type = rawConfig.boot_script.type;
  if (! allowedTypes.includes(type)) {
    throw new Error(`BootScript of type ${type} is not supported.
    Valid values are: ${allowedTypes}`);
  }

  return rawConfig.boot_script;
}

function generate({ config, output, status }) {
  if (status.error) return { config, output, status };
  if (config.boot_script === null) return { config, output, status };

  const bootScript = generateBootShellScript(config);
  const newOutput = { ...output, ...{ bootScript } };

  return { config, output: newOutput, status };
}

function generateBootShellScript({ boot_script: bsConfig }) {
  const shebang = _shGetShebang(bsConfig);
  const flags = _shGetFlags(bsConfig);
  const body = _shGetBody(bsConfig);

  return `${shebang}\n${flags}\n\n${body}`;
}

function _shGetShebang({ she_bang }) {
  if (she_bang === undefined) return defaultShebang;
  if (she_bang.indexOf('#!') === -1 && !process.env.hideWarnings)
    console.log(`[WARNING] Shebang seems wrong: ${she_bang}`);
  return she_bang;
}

function _shGetFlags({ flags }) {
  if (flags === undefined) return '';
  if (flags.indexOf('set -') === -1) return `set -${flags}`;
  return flags;
}

function _shGetBody({ cmds }) {
  return cmds.reduce((acc, cmdLine) => {
    const cmdType = typeof(cmdLine);

    if (cmdType === 'string')
      return acc + cmdLine + '\n';
    else
      throw new Error('Custom CMDs are currently unsupported.');
  }, '');
}

module.exports = { parseRawConfig, generate };