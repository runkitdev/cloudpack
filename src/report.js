'use strict';

const output = ({ config, output, status }) => {
  if (config.cliOpts.dryRun) return output_dryrun(output, config);
  if (status.error) return output_error(output, status);
  return output_success(output, config);
};

const output_success = (output, config) => {
  if (process.env.verbose) output_dryrun(output, config);

  const relevantOutput = {
    ...(config.backends.builder.getRelevantOutput(output, config)),
    ...(config.backends.launchTemplate.getRelevantOutput(output, config))
  };

  if (config.cliOpts.outputFormat === 'json') {
    console.log(JSON.stringify(relevantOutput, null, 2));
  }
};

const output_error = (output, status) => {
  console.log('\n\n\nCloudpack error: ' + status.errorMsg);
};

const output_dryrun = (output, config) => {
  console.log('Generated Packer template:');
  console.log(JSON.stringify(output.packerTemplate, null, 2));

  if (output.bootScript !== null) {
    console.log('\n\nGenerated BootScript:');
    console.log(`\n${output.bootScript}`);
  }

  if (process.env.verbose) {
    console.log('\n\n[Debug] Internal pipeline config:');
    console.log(JSON.stringify(config, null, 2));
  }
};

module.exports = { output };