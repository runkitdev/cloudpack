'use strict';

const assert = require('assert');
const rewire = require('rewire');

const parser = rewire('../../src/parser');

describe('parser', function () {
  describe('#parse', function () {
    const parse = parser.parse;

    it('parses basic example', function () {
      const path = 'test/config_examples/cfg_simple.json';
      const cliOpts = { vars: { version: '1.0' }, tmpPath: '/tmp' };

      const { config, output, status } = parse(path, cliOpts);

      assert.equal(config.backends.auth.name, 'aws');
      assert.equal(config.backends.builder.name, 'amazon-chroot');
      assert.equal(config.backends.launchTemplate.name, 'aws');

      assert.deepEqual(config.cliOpts, cliOpts);
      assert.equal(config.auth.access_key, 'myAccessKey');
      assert.equal(config.auth.secret_key, 'mySecretKey');
      assert.equal(config.auth.region, 'myRegion');
      assert.equal(config.builder.ami_name, 'MyAmazingApp-1.0');
      assert.equal(config.builder.source_ami, 'ami-12345678');
      assert.equal(config.launch_template.method, 'update');
      assert.equal(
        config.launch_template.modifications.ImageId, '{{ runtime.amiId }}'
      );

      assert.equal(output.bootScript, null);
      assert.equal(output.packerTemplate, null);
      assert.equal(output.amiId, null);
      assert.equal(output.snapshotId, null);
      assert.equal(output.launchTemplateid, null);

      assert.equal(status.error, false);
    });

    it('parses minimal example', function () {
      const path = 'test/config_examples/cfg_minimal.json';
      const { config } = parse(path, {});

      assert.equal(config.backends.auth, null);
      assert.equal(config.backends.builder.name, 'amazon-chroot');
      assert.equal(config.backends.launchTemplate, null);

      assert.equal(config.auth, null);
      assert.deepEqual(config.build_script, []);
      assert.equal(config.boot_script, null);
      assert.equal(config.launchTemplate, null);
    });
  });
});

