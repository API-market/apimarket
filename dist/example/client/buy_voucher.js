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

const pathToKeyFile = './key.json';
const configFilePath = './config.json';
const offerAddress = '0x6adfa13dd131328b704a83dc8a08b37298af7837'; // For purchasing a new voucher

process.env.CONTRACT_ADDRESS = '0xf7f0e2e0682c2fabe35201b0f5a8832f3790dce1' // payment channel contract
(
/*#__PURE__*/
_asyncToGenerator(function* () {
  const config = JSON.parse(fs.readFileSync(configFilePath));
  const keys = JSON.parse(fs.readFileSync(pathToKeyFile));
  let client = yield Client.init(config, keys);

  try {
    const voucherAddress = yield client.purchase(offerAddress);
    console.log("VOUCHER ADDRESS:", voucherAddress);
  } catch (err) {
    console.log(err);
  }
}))();