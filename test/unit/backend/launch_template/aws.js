'use strict';

const assert = require('assert');
const rewire = require('rewire');

const launchTemplateAWS = rewire('../../../../src/backend/launch_template/aws');

describe('LaunchTemplateAWS', function () {
  describe('#parseRawConfig', function () {
    const parseRawConfig = launchTemplateAWS.parseRawConfig;
    it('detects when user wants to create LT from scratch', function () {
      const ltRawConfig = {
        'template_name': 'MyCoolTemplate',
        'template_data': {
          'ImageId': '{{ runtime.amiId }}'
        }
      };
      const rawConfig = { launch_template: { 'aws': ltRawConfig } };

      const ltConfig = parseRawConfig(rawConfig);

      assert.equal(ltConfig.method, 'create');
      assert.equal(ltConfig.template_name, ltRawConfig.template_name);
      assert.equal(ltConfig.template_data, ltRawConfig.template_data);
    });

    it('blows up when user does not set `template_data` entries', function () {
      const ltRawConfig = {
        'template_name': 'MyCoolTemplate',
        'template_data': {}
      };
      const rawConfig = { launch_template: { 'aws': ltRawConfig } };

      assert.throws(
        function () { parseRawConfig(rawConfig); },
        Error
      );
    });

    it('detects when user wants to update previously set LT', function () {
      const ltRawConfig = {
        'source_template': 'lt-1234567890',
        'source_version': '1',
        'modifications': {
          'ImageId': '{{ runtime.amiId }}'
        }
      };
      const rawConfig = { launch_template: { 'aws': ltRawConfig } };

      const ltConfig = parseRawConfig(rawConfig);

      assert.equal(ltConfig.method, 'update');
      assert.equal(ltConfig.source_template, ltRawConfig.source_template);
      assert.equal(ltConfig.modifications, ltRawConfig.modifications);
    });
  });
});

