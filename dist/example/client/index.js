"use strict";

require("core-js/modules/es6.array.sort");

require("core-js/modules/es7.object.values");

require("core-js/modules/es7.object.entries");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es7.string.pad-start");

require("core-js/modules/es7.string.pad-end");

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const fs = require('fs');

const apimarket = require('../../dist/index');

const configFilePath = '/config.json';
const config = JSON.parse(fs.readFileSync(__dirname + configFilePath));
const registrySelector = 'io.hadron.spaceTelescope';
const request = {
  "query": "{ spaceTelescope(image:\"https://cdn.spacetelescope.org/archives/images/thumb300y/potw1452a.jpg\") {results} }"
};

const run =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* () {
    let client = yield apimarket.init(config);

    try {
      const response = yield client.fetch(registrySelector, request);
      console.log(JSON.stringify(response, null, 2));
    } catch (err) {
      console.error(err);
    }
  });

  return function run() {
    return _ref.apply(this, arguments);
  };
}();

run();