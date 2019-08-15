'use strict';

const parser = require('./parser');
const bootScript = require('./boot_script');
const packer = require('./packer');
const launchTemplate = require('./launch_template');
const report = require('./report');

const executePipeline = async(configPath, opts) => {
  let pipelineAcc = parser.parse(configPath, opts);

  pipelineAcc = bootScript.generate(pipelineAcc);
  pipelineAcc = packer.generateTemplate(pipelineAcc);
  pipelineAcc = await packer.build(pipelineAcc);
  pipelineAcc = await launchTemplate.create(pipelineAcc);

  report.output(pipelineAcc);
};

module.exports = { executePipeline };