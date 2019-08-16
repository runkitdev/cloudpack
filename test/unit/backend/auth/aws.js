'use strict';

const assert = require('assert');
const rewire = require('rewire');

const authAWS = rewire('../../../../src/backend/auth/aws');

function wrapRawConfig(authConfig) {
  return { auth: { 'aws': authConfig } };
}

describe('AuthAWS', function () {
  describe('#parseRawConfig', function () {
    const parseRawConfig = authAWS.parseRawConfig;
    it('treats empty strings as environment vars', function () {
      const authRawConfig = { access_key: '', secret_key: '', region: '' };
      const rawConfig = wrapRawConfig(authRawConfig);

      const authConfig = parseRawConfig(rawConfig);

      assert.equal(authConfig.access_key, 'environment');
      assert.equal(authConfig.secret_key, 'environment');
      assert.equal(authConfig.region, 'environment');
    });

    it('treats omissions as environment vars', function () {
      const authConfig = parseRawConfig(wrapRawConfig({}));

      assert.equal(authConfig.access_key, 'environment');
      assert.equal(authConfig.secret_key, 'environment');
      assert.equal(authConfig.region, 'environment');
    });
  });
});

