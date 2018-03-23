"use strict";

require("core-js/modules/es6.array.sort");

require("core-js/modules/es7.object.values");

require("core-js/modules/es7.object.entries");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es7.string.pad-start");

require("core-js/modules/es7.string.pad-end");

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const {
  initServer
} = require('../../index');

const fs = require('fs');

const configFilePath = '/config.json';
const config = JSON.parse(fs.readFileSync(__dirname + configFilePath));
const port = process.env.PORT || 8080; // in this example, we run a local server that is essentially a proxy, this name is used to select the right offer data, the remote endpoints are listed in the configuration

const endpoint = "http://sandbox.dev.aikon.com:3405/";

const handler =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (req, res) {
    res.json({
      x: req.body.x + 1
    });
  });

  return function handler(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

const run =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(function* (endpoint, port, handler, config) {
    const server = yield initServer(endpoint, handler, config);
    server.listen(port, () => console.log(`listening on port: ${port}`));
  });

  return function run(_x3, _x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();

run(endpoint, port, handler, config);