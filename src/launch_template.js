'use strict';

async function create([config, output, status]) {
  if (config.launch_template === null) return [config, output, status];

  const method = config.launch_template.method;
  const result = await config.backends.launchTempate[method](config);

  if (! result.success) {
    return [config, output, { error: true, errorMsg: result.errorMsg }];
  }

  return [config, { ...output, ...result.resources }, status];
}

module.exports = { create };