'use strict';

const assert = require('assert');
const rewire = require('rewire');

const bsModule = rewire('../../../src/boot_script/boot_script');

describe('bootScript', function () {
  describe('#generate', function () {
    const generate = bsModule.generate;

    it('appends the generated script to the output accumulator', function () {
      const config = { boot_script: { cmds: ['one', 'two'] } };
      const output = { bootScript: null };
      const pipelineAcc = { config, output, status: {} };

      const { config: newConfig, output: newOutput } = generate(pipelineAcc);

      assert.equal(newOutput.bootScript, '#!/usr/bin/env bash\n\n\none\ntwo\n');
      assert.equal(newConfig, config);
    });
  });

  // INTERNALS
  describe('#generateBootShellScript', function () {
    const generateBootShellScript = bsModule.__get__('generateBootShellScript');

    it('generates the correct shell script', function () {
      const conf1 = {
        cmds: [ 'firstLine', 'secondLine' ]
      };

      const expectedShell1 = `#!/usr/bin/env bash


firstLine
secondLine
`;

      const conf2 = {
        she_bang: '#!/bin/sh',
        flags: 'eu',
        cmds: [ 'echo \'wat\' > /dev/null', 'FOO=$(bar)' ]
      };

      const expectedShell2 = `#!/bin/sh
set -eu

echo 'wat' > /dev/null
FOO=$(bar)
`;

      const conf3 = {
        flags: 'set -euo',
        cmds: [ '#TODO' ]
      };

      const expectedShell3 = `#!/usr/bin/env bash
set -euo

#TODO
`;


      assert.equal(
        generateBootShellScript({ boot_script: conf1 }), expectedShell1
      );
      assert.equal(
        generateBootShellScript({ boot_script: conf2 }), expectedShell2
      );
      assert.equal(
        generateBootShellScript({ boot_script: conf3 }), expectedShell3
      );
    });
  });
});