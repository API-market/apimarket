"use strict";

require("core-js/modules/es6.array.sort");

require("core-js/modules/es7.object.values");

require("core-js/modules/es7.object.entries");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es7.string.pad-start");

require("core-js/modules/es7.string.pad-end");

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const fs = require('fs');

const http = require('http');

const Client = require('../../lib/client');

const pathToKeyFile = './example/key.json';
const configFilePath = './example/config.json';
const apiEndpoint = 'io.hadron.spaceTelescope';
process.env.CONTRACT_ADDRESS = '0xedec26295df8a61a29aece56e36e7e2bc1d65205'; // payment channel contract

process.env.PORT = 8000;
const config = JSON.parse(fs.readFileSync(configFilePath));
const keys = JSON.parse(fs.readFileSync(pathToKeyFile));

_asyncToGenerator(function* () {
  //const client = await Client.init(keys, config)
  console.log("Client.init()"); //const endpoint = await client.open(config.registry[apiEndpoint])

  console.log("client.open"); // NOTE A temporary mock for the fetching data through the AIKON protocol

  let fetch =
  /*#__PURE__*/
  function () {
    var _ref2 = _asyncToGenerator(function* (data) {
      return data.split('').reverse().join('');
    });

    return function fetch(_x) {
      return _ref2.apply(this, arguments);
    };
  }();

  http.createServer((req, res) => {
    try {
      let body = [];
      req.on('data', chunk => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString(); //endpoint.fetch(body).then((result) => {

        fetch(body).then(result => {
          res.end(result);
        });
      });
    } catch (err) {
      res.statusCode = 404;
      res.end();
    }
  }).listen(process.env.PORT);
})();