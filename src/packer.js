'use strict';

const fs = require('fs');
const utils = require('util');
const { spawn, exec } = require('child_process');
const variableHandler = require('./variable_handler');
const rcLocal = require('./boot_script/rc_local');

const execAsync = utils.promisify(exec);
const unlink = utils.promisify(fs.unlink);

function generateTemplate({ config, output, status }) {
  // TODO: Relay other template sections
  const packerTemplate = {
    builders: generateBuilders(config),
    provisioners: generateProvisioners(config, output)
  };

  const newOutput = { ...output, ...{ packerTemplate } };

  if (config.cliOpts.dryRun) {
    return { config, output: newOutput, status: { error: true } };
  }

  return { config, output: newOutput, status };
}

async function build({ config, output, status }) {
  if (status.error) return { config, output, status };
  
  const templatePath = `${config.cliOpts.tmpPath}/packer.json`;
  writePackerTemplate(templatePath, output.packerTemplate);

  try {
    await execPackerValidate(templatePath);
    if (process.env.verbose) console.log('Packer template validated.');
  } catch(e) {
    const errorMsg = `Generated Packer template is invalid. Reason:\n\n${e.stdout}\n\nYou can inspect the template at ${templatePath}`;
    return { config, output, status: { error: true, errorMsg } };
  }

  try {
    const buildResult = await execPackerBuild(templatePath);
    const parsedResult = config.backends.builder.parseBuildResult(buildResult);

    if (! parsedResult.success) {
      const newStatus = { error: true, errorMsg: parsedResult.errorMsg };
      return { config, output, status: newStatus };
    }

    const newOutput = { ...output, ...parsedResult.resources };
    const newConfig = variableHandler.updateRuntimeVariables(config, newOutput);

    postBuildHook(newConfig, newOutput);

    return { config: newConfig, output: newOutput, status };
  } catch(e) {
    if (e.code === 'EPERM') {
      const errorMsg = 'packer build needs to run as root. Make sure to `sudo` cloudpack';
      return { config, output, status: { error: true, errorMsg } };
    }

    throw e;
  } finally {
    cleanUpPackerTemplate(templatePath);
  }
}

async function execPackerValidate(templatePath) {
  if (process.env.verbose) console.log(`CMD: packer validate ${templatePath}`);
  await execAsync(`packer validate ${templatePath}`);
}

async function execPackerBuild(templatePath) {
  if (process.env.verbose) console.log(`CMD: packer build ${templatePath}`);
  const build = spawn(
    'packer', ['build', '-color=false', templatePath], { uid: 0 }
  );

  let stdout = '';
  for await (const data of build.stdout) {
    const dataStr = data.toString();
    stdout = stdout.concat(dataStr);

    if (process.env.verbose) process.stdout.write(dataStr);
  }

  let stderr = '';
  for await (const data of build.stderr) {
    const dataStr = data.toString();
    stderr = stderr.concat(dataStr);

    if (process.env.verbose) process.stdout.write(dataStr);
  }

  return { stdout, stderr };
}

function writePackerTemplate(templatePath, packerTemplate) {
  // Generated template may contain credentials
  const opts = { mode: 0o600 };
  fs.writeFileSync(templatePath, JSON.stringify(packerTemplate, null, 2), opts);

  if (process.env.verbose)
    console.log(`Packer template written to ${templatePath}`);
}

async function cleanUpPackerTemplate(templatePath) {
  try {
    await unlink(templatePath);

    if (process.env.verbose)
      console.log(`Packer template deleted from ${templatePath}`);
  } catch(e) {
    console.log('Error while cleaning up generated packer template...');
  }
}

function generateBuilders(config) {
  return [config.backends.builder.configureBuilder(config)];
}

function generateProvisioners(config, { bootScript }) {
  if (config.boot_script === null) return config.build_script;
  if (config.boot_script.type !== 'rc.local') return config.build_script;

  return [
    ...config.build_script,
    ...rcLocal.generateProvisioners(bootScript, config)
  ];
}

function postBuildHook(config, ) {
  rcLocal.cleanUpBootFile(config);
}

module.exports = { generateTemplate, build };