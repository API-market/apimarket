"use strict";

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const {
  Client
} = require('../../index');

const run =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* () {
    let client = new Client({
      httpEndpoint: "http://eos1.aikon.com:8888",
      keyFilePath: "/../example/client/keys.json",
      keyProvider: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3",
      oreAccountName: "eosio"
    });
    const url = "http://sandbox.dev.aikon.com:3405/";
    const body = {
      "query": "{ spaceTelescope(image:\"https://cdn.spacetelescope.org/archives/images/thumb300y/potw1452a.jpg\") {results} }"
    };

    try {
      const response = yield client.fetch(url, body); //console.log(JSON.stringify(response, null, 2))
    } catch (err) {
      console.error(err);
    }

    process.exit(0);
  });

  return function run() {
    return _ref.apply(this, arguments);
  };
}();

run();