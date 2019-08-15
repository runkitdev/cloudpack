'use strict';

const awsAuth = require('../auth/aws');

function parseRawConfig(rawConfig) {
  // TODO: Missing support for relays on the top-level (e.g. VersionDescription)
  const ltConfig = rawConfig.launch_template.aws;
  const ltKeys = Object.keys(ltConfig);

  if (ltKeys.includes('source_template') && ltKeys.includes('modifications')) {
    const source_version = ltConfig.source_version;
    if (source_version !== undefined && typeof(source_version) !== 'string')
      throw new Error('LaunchTemplate\'s `source_version` must be a string.');

    return {
      method: 'update',
      source_template: ltConfig.source_template,
      modifications: ltConfig.modifications,
      source_version
    };
  }

  if (!ltKeys.includes('template_name') || !ltKeys.includes('template_data')) {
    throw new Error(`
    Invalid Cloudpack LaunchTemplate configuration.\n
    When specifying your configuration, you may want either to create a new
    LaunchTemplate from scratch, or to update an existing one.\n
    To create a new one, you must specify the \`template_name\` and
    \`template_data\` keys.\n
    To update an existing one, you must specify the \`source_template\`, which
    is the source LaunchTemplate ID, and \`modifications\`, which is a map
    containing the modifications to be performed on top of the base template.\n
    Both \`template_data\` and \`modifications\` use the same nomenclature
    the official AWS API uses: https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_RequestLaunchTemplateData.html
    `);
  }

  if (ltConfig.template_data === {})
    throw new Error('Your `template_data` LaunchTemplate entry must not be empty.');

  return {
    method: 'create',
    template_name: ltConfig.template_name,
    template_data: ltConfig.template_data
  };
}

async function create(config) {
  const ec2 = awsAuth.getClientEC2(config);
  const params = buildCreateParams(config);

  try {
    const result = await _awsCreateLaunchTemplate(ec2, params);
    const launchTemplateId = result.LaunchTemplate.LaunchTemplateId;

    if (process.env.verbose) console.log(`LaunchTemplate created: \n${result}`);

    return { success: true, resources: { launchTemplateId } };
  } catch(e) {
    if (process.env.verbose) console.log(e);

    let errorMsg = `
    Error while creating new launch template.\n
    Message: ${e.message}\n
    Code: ${e.code} (${e.statusCode})
    RequestId: ${e.requestId}
    `;

    return { success: false, errorMsg: errorMsg };
  }

}

async function update(config) {
  const ec2 = awsAuth.getClientEC2(config);
  const params = buildUpdateParams(config);

  try {
    const result = await _awsCreateLaunchTemplateVersion(ec2, params);
    const launchTemplateId = result.LaunchTemplateVersion.LaunchTemplateId;

    if (process.env.verbose) console.log(`LaunchTemplate updated: \n${result}`);

    return { success: true, resources: { launchTemplateId } };
  } catch(e) {
    if (process.env.verbose) console.log(e);

    let errorMsg = `
    Error while creating new launch template version.\n
    Message: ${e.message}\n
    Code: ${e.code} (${e.statusCode})
    RequestId: ${e.requestId}
    `;

    return { success: false, errorMsg: errorMsg };
  }

}

function getRelevantOutput(output, config) {
  if (config.launch_template === null) return {};
  if (output.launchTemplateId === null && process.env.verbose)
    console.log('[WARNING] Something went wrong with LaunchTemplate creation');

  return { launchTemplateId: output.launchTemplateId };
}

function buildCreateParams({ launch_template: ltConfig }) {
  return {
    LaunchTemplateName: ltConfig.template_name,
    LaunchTemplateData: ltConfig.template_data
  };
}

function buildUpdateParams({ launch_template: ltConfig }) {
  const baseConfig = {
    LaunchTemplateId: ltConfig.source_template,
    LaunchTemplateData: ltConfig.modifications
  };

  if (ltConfig.source_version !== undefined) {
    return { ...baseConfig, ...{ SourceVersion: ltConfig.source_version } };
  }

  return baseConfig;
}

async function _awsCreateLaunchTemplate(ec2, params) {
  if (process.env.verbose) console.log('[AWS] EC2.CreateLaunchTemplate');
  return await ec2.createLaunchTemplate(params).promise();
}

async function _awsCreateLaunchTemplateVersion(ec2, params) {
  if (process.env.verbose) console.log('[AWS] EC2.CreateLaunchTemplateVersion');
  return await ec2.createLaunchTemplateVersion(params).promise();
}

module.exports = { parseRawConfig, create, update, getRelevantOutput };