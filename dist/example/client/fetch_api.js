"use strict";

require("core-js/modules/es6.array.sort");

require("core-js/modules/es7.object.values");

require("core-js/modules/es7.object.entries");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es7.string.pad-start");

require("core-js/modules/es7.string.pad-end");

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const fs = require('fs');

const Client = require('../../lib/client');

const pathToKeyFile = './example/key.json';
const configFilePath = './example/config.json';
const apiEndpoint = 'io.hadron.spaceTelescope';
process.env.CONTRACT_ADDRESS = '0xedec26295df8a61a29aece56e36e7e2bc1d65205' // payment channel contract
(
/*#__PURE__*/
_asyncToGenerator(function* () {
  const config = JSON.parse(fs.readFileSync(configFilePath));
  const keys = JSON.parse(fs.readFileSync(pathToKeyFile));
  let client = yield Client.init(config, keys);

  try {
    const endpoint = yield client.open(config.registry[apiEndpoint]);
    endpoint.fetch({
      x: 1
    });
    console.log("RESULT:", result);
  } catch (err) {
    console.log(err);
  }
}))();