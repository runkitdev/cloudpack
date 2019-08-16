'use strict';

const assert = require('assert');
const rewire = require('rewire');

const packer = rewire('../../src/packer');

const builderAmazonChroot = rewire('../../src/backend/builder/amazon_chroot');

describe('packer', function () {
  describe('#generateTemplate', function () {
    const generateTemplate = packer.generateTemplate;

    it('generates the desired template', function () {
      const config = {
        backends: { builder: builderAmazonChroot },
        cliOpts: { tmpPath: '/tmp' },
        auth: null,
        builder: {
          ami_name: 'ami-12345678',
          source_ami: 'ami-87654321'
        },
        build_script: ['first', 'second'],
        boot_script: {
          type: 'rc.local'
        }
      };
      const output = { bootScript: 'generatedScript', packerTemplate: null };

      const pipelineAcc = { config, output, status: {} };

      var { output: { packerTemplate } } = generateTemplate(pipelineAcc);

      const [builderTemplate] = packerTemplate.builders;
      assert.equal(builderTemplate.ami_name, config.builder.ami_name);
      assert.equal(builderTemplate.source_ami, config.builder.source_ami);
      assert.equal(builderTemplate.type, 'amazon-chroot');

      assert.equal(packerTemplate.provisioners.length, 4);
      const [prov1, prov2, prov3, prov4] = packerTemplate.provisioners;
      assert.equal(prov1, 'first');
      assert.equal(prov2, 'second');
      assert.equal(prov3.type, 'file');
      assert.equal(prov3.destination, '/etc/rc.local');
      assert.equal(prov4.type, 'shell');
      assert.equal(prov4.inline[0], 'chmod +x /etc/rc.local');
    });
  });
});