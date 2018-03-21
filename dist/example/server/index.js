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

const config = {
  "registry": {
    "io.hadron.spaceTelescope": {
      "endpoint": 'http://sandbox.dev.aikon.com:3405/',
      "offer": {
        "address": '0x19f9591fbe24b596434aaad7c80884a863a56b0e'
      }
    }
  },
  "verifier": {
    "publicKey": `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfy0YUA2nDgEIbOC2FxE6wygiNFUd
eH6vYfcHz+uioYq+GU81Axysh09GKhxsRu4OIK668BzCyw9DI/HDysTV2A==
-----END PUBLIC KEY-----`
  },
  "services": {
    "web3": {
      "endpoint": "http://ganache1.api.market:8545"
    },
    "ipfs": {
      "endpoint": "http://ipfs2-ext.dev.api.market:5001"
    }
  }
};
const port = process.env.PORT || 8080;

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
  var _ref2 = _asyncToGenerator(function* (port, handler, config) {
    const server = yield initServer(handler, config);
    server.listen(port, () => console.log(`listening on port: ${port}`));
  });

  return function run(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

run(port, handler, config);