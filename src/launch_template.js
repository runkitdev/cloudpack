'use strict';

async function create({ config, output, status }) {
  if (status.error) return { config, output, status };
  if (config.launch_template === null) return { config, output, status };

  const method = config.launch_template.method;
  const result = await config.backends.launchTemplate[method](config);

  if (! result.success) {
    const newStatus = { error: true, errorMsg: result.errorMsg };
    return { config, output, status: newStatus };
  }

  return { config, output: { ...output, ...result.resources }, status };
}

module.exports = { create };