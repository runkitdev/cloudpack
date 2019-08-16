'use strict';

const assert = require('assert');
const rewire = require('rewire');

const builderAmazonChroot =
 rewire('../../../../src/backend/builder/amazon_chroot');

describe('Builder: amazon-chroot', function () {
  describe('#parseBuildResult', function () {
    const parseBuildResult = builderAmazonChroot.parseBuildResult;
    it('should return the created resources (on success)', function () {
      const output = `
==> amazon-chroot: Prevalidating AMI Name: MyProductionApp-1565968356
==> amazon-chroot: Gathering information about this EC2 instance...
    amazon-chroot: Found Image ID: ami-0d1a13e419ec9285d
==> amazon-chroot: Checking the root device on source AMI...
==> amazon-chroot: Creating the root volume...
==> amazon-chroot: Attaching the root volume to /dev/sdf
==> amazon-chroot: Mounting the root device...
==> amazon-chroot: Mounting additional paths within the chroot...
    amazon-chroot: Mounting: /proc
    amazon-chroot: Mounting: /sys
    amazon-chroot: Mounting: /dev
    amazon-chroot: Mounting: /dev/pts
    amazon-chroot: Mounting: /proc/sys/fs/binfmt_misc
==> amazon-chroot: Copying files from host to chroot...
    amazon-chroot: /etc/resolv.conf
==> amazon-chroot: Provisioning with shell script: /tmp/packer-shell331565711
==> amazon-chroot: Uploading /tmp/cloudpack_tmp_boot_file.sh => /etc/rc.local
cloudpack_tmp_boot_file.sh 109 B / 109 B  100.00% 0s
==> amazon-chroot: Provisioning with shell script: /tmp/packer-shell266673310
==> amazon-chroot: Unmounting the root device...
==> amazon-chroot: Detaching EBS volume...
==> amazon-chroot: Creating snapshot...
    amazon-chroot: Snapshot ID: snap-0adbdf656ab0b8265
==> amazon-chroot: Registering the AMI...
==> amazon-chroot: AMI: ami-0d0787a2f6ac89911
==> amazon-chroot: Waiting for AMI to become ready...
==> amazon-chroot: Deleting the created EBS volume...
Build 'amazon-chroot' finished.

==> Builds finished. The artifacts of successful builds are:
--> amazon-chroot: AMIs were created:
us-west-2: ami-0d0787a2f6ac89911
`;

      const parsedResult = parseBuildResult({ stdout: output });
      assert.equal(parsedResult.success, true);
      assert.equal(parsedResult.resources.amiId, 'ami-0d0787a2f6ac89911');
      assert.equal(parsedResult.resources.snapshotId, 'snap-0adbdf656ab0b8265');
    });

    it('handles failures', function () {
      const output = `
==> amazon-chroot: Prevalidating AMI Name: MyProductionApp-1565968356
==> amazon-chroot: Error: AMI Name: 'MyProductionApp-1565968356' is used by an existing AMI: ami-0d0787a2f6ac89911
Build 'amazon-chroot' errored: Error: AMI Name: 'MyProductionApp-1565968356' is used by an existing AMI: ami-0d0787a2f6ac89911

==> Some builds didn't complete successfully and had errors:
--> amazon-chroot: Error: AMI Name: 'MyProductionApp-1565968356' is used by an existing AMI: ami-0d0787a2f6ac89911

==> Builds finished but no artifacts were created.`;

      const parsedResult = parseBuildResult({ stdout: output });
      assert.equal(parsedResult.success, false);
    });
  });
});