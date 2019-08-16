'use strict';

const assert = require('assert');
const rewire = require('rewire');

const report = rewire('../../src/report');

const builderAmazonChroot = rewire('../../src/backend/builder/amazon_chroot');
const launchTemplateAWS = rewire('../../src/backend/launch_template/aws');

describe('report', function () {
  describe('#assembleRelevantOutput', function () {
    const assembleRelevantOutput = report.__get__('assembleRelevantOutput');

    it('combines all relevant outputs and prints them JSONly', function () {
      const output = {
        amiId: 'myAmiId',
        snapshotId: 'mySnapshotId',
        launchTemplateId: 'myLaunchTemplateId'
      };

      const config = {
        backends: {
          builder: builderAmazonChroot,
          launchTemplate: launchTemplateAWS
        },
        launch_template: { }
      };

      const relevantOutput = assembleRelevantOutput(output, config);

      assert.equal(relevantOutput.amiId, output.amiId);
      assert.equal(relevantOutput.snapshotId, output.snapshotId);
      assert.equal(relevantOutput.launchTemplateId, output.launchTemplateId);
    });
  });
});