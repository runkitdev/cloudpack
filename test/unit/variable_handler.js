'use strict';

const assert = require('assert');
const rewire = require('rewire');

const variableHandler = rewire('../../src/variable_handler');

describe('variableHandler', function () {
  describe('#updateUserVariables', function () {
    const updateUserVariables = variableHandler.updateUserVariables;

    it('updates user variables', function() {
      const config = { foo: { bar: '{{ var.name }}' } };
      const vars = { name: 'myName' };
      const expected = { foo: { bar: vars.name } };

      assert.deepEqual(updateUserVariables(config, vars), expected);
    });

    it('fails when there are missing variables', function () {
      const config = { foo: '{{ var.name }}', bar: '{{ var.notFound }}' };
      const vars = { name: 'myName' };

      assert.throws( function() { updateUserVariables(config, vars); }, Error);
    });

    it('skips unrelated vars (e.g. runtime vars)', function () {
      const config = { foo: '{{ var.name }}', bar: '{{ runtime.amiId }}' };
      const vars = { name: 'myName' };
      const expected = { foo: vars.name, bar: '{{ runtime.amiId }}' };

      assert.deepEqual(updateUserVariables(config, vars), expected);
    });
  });

  describe('#updateRuntimeVariables', function () {
    const updateRuntimeVariables = variableHandler.updateRuntimeVariables;

    it('updates runtime variables', function() {
      const config = { foo: '{{ runtime.amiId }}' };
      const output = { amiId: 'ami-12345678' };
      const expected = { foo: output.amiId };

      assert.deepEqual(updateRuntimeVariables(config, output), expected);
    });

    it('skips when there are missing variables', function () {
      const config = { foo: '{{ runtime.id }}', bar: '{{ runtime.notYet }}' };
      const output = { id: 'id-1234' };
      const expected = { foo: output.id, bar: '{{ runtime.notYet }}' };

      assert.deepEqual(updateRuntimeVariables(config, output), expected);
    });
  });

  // Internals
  describe('#replaceEntry', function () {
    const replaceEntry = variableHandler.__get__('replaceEntry');

    it('parses matching mustaches', function() {
      const input = ['{{ prefix.foo }}'];
      const scope = { prefix: { foo: 'bar' } };
      const opts = { prefix: 'prefix' };

      assert.deepEqual(replaceEntry(input, { scope, opts }), ['bar']);
    });

    it('keeps arrays as arrays', function() {
      const input = ['foo', { bar: { baz: [1, 'foo', null, undefined] } } ];
      assert.deepEqual(replaceEntry(input, {}), input);
    });

    it('handles nested structures', function() {
      const input = {
        key1: ['{{ ctx.first }}', { foo: 'bar' }],
        key2: null,
        key3: { wat: { am: { I: '{{ ctx.doing }}' } } },
        key4: [1, undefined, { nest: null }]
      };

      const scope = { ctx: { first: 'first', doing: 'doing' } };
      const opts = { prefix: 'ctx' };

      const expected = {
        key1: ['first', { foo: 'bar' }],
        key2: null,
        key3: { wat: { am: { I: 'doing' } } },
        key4: [1, undefined, { nest: null } ]
      };

      assert.deepEqual(replaceEntry(input, { scope, opts }), expected);
    });
  });

  describe('#replaceVariable', function () {
    const replaceVariable = variableHandler.__get__('replaceVariable');

    it('skips when `onMissing` = `skip`', function () {
      const str1 = '{{ ctx.not_found }}';
      const str2 = '{{ no_prefix_var }}';

      const scope = { ctx: { bar: 'baz', no_prefix_var: 'wat' } };
      const opts = { prefix: 'ctx', onMissing: 'skip' };

      assert.equal(replaceVariable(str1, { scope, opts }), str1);
      assert.equal(replaceVariable(str2, { scope, opts }), str2);
    });

    it('fails when `onMissing` = `fail`', function () {
      const str = '{{ ctx.not_found }}';
      const scope = { ctx: { bar: 'baz', no_prefix_var: 'wat' } };
      const opts = { prefix: 'ctx', onMissing: 'fail' };

      assert.throws(
        function() { replaceVariable(str, { scope, opts }); } , Error
      );
    });
  });
});