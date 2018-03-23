"use strict";

require("core-js/modules/es6.array.sort");

require("core-js/modules/es7.object.values");

require("core-js/modules/es7.object.entries");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es7.string.pad-start");

require("core-js/modules/es7.string.pad-end");

require("url-polyfill");

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const {
  instrument,
  right,
  verifier,
  capability,
  condition
} = require('open-rights-exchange');

const connect = require('connect');

const verifierPublicKeyFromConfig = config => {
  return config.verifier.publicKey.replace(/\\n/g, '\n');
};

const fromRegistry = (config, endpoint) => {
  const registry = config.registry;
  const names = Object.keys(registry);

  if (names.length !== 1) {
    throw new Error('only one offer is currently supported');
  }

  const key = names[0];
  const scope = registry[key];
  return scope[endpoint];
};

exports.fromRegistry = fromRegistry;

const instrumentAddressFromConfig = (endpoint, config) => {
  return fromRegistry(config, endpoint).offer.address;
};

const Web3 = require('web3');

const connectWeb3 = ({
  endpoint
}) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(endpoint));
  return web3;
};

const ipfsAPI = require('ipfs-api');

const url = require('url');

const connectIPFS = ({
  endpoint
}) => {
  const ipfsUrl = url.parse(endpoint);
  const ipfs = ipfsAPI({
    host: ipfsUrl.hostname,
    port: ipfsUrl.port,
    protocol: ipfsUrl.protocol.slice(0, -1)
  });
  return ipfs;
};

const middlewareFor =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (endpoint, config, web3, ipfs) {
    if (web3 === undefined) {
      web3 = connectWeb3(config.services.web3);
    }

    if (ipfs === undefined) {
      ipfs = connectIPFS(config.services.ipfs);
    }

    const instrumentAddress = instrumentAddressFromConfig(endpoint, config);
    const offer = yield instrument.at(instrumentAddress, {
      web3,
      ipfs
    });
    const [voucherRight] = instrument.searchRights(offer, capability.forAPI({
      apiEndpoint: endpoint
    }));

    if (!voucherRight) {
      throw new Error(`the instrument address ${instrumentAddress} cannot support an API voucher`);
    }

    const [paymentChannelCondition] = right.findProperties(voucherRight, condition.forPaymentChannel());
    const {
      verifytokenEndpoint
    } = condition.properties(paymentChannelCondition);
    const verifierPublicKey = verifierPublicKeyFromConfig(config);
    const jwtMiddleware = verifier.middlewareDecodesJWT(verifierPublicKey);
    const addressMiddleware = verifier.middlewareMatchesInstrumentAddress(instrumentAddress);
    const acceptTokenMiddleware = verifier.middlewareExpectsPaymentChannelToken(verifytokenEndpoint);
    const chain = connect();
    const middlewares = [jwtMiddleware, addressMiddleware, acceptTokenMiddleware];
    middlewares.forEach(m => chain.use(m));
    return chain;
  });

  return function middlewareFor(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

exports.middlewareFor;

const express = require('express');

const logger = require('morgan');

const cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');

const buildServer = (endpoint, handler, ...middlewares) => {
  const app = express();
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(cookieParser());

  for (let middleware of middlewares) {
    app.use(middleware);
  } //const path = new URL(endpoint).pathname


  const path = url.parse(endpoint).pathname;
  app.post(path, handler); // catch 404 and forward to error handler

  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }); // error handler

  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {}; // render the error page

    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
  return app;
};

const build =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(function* (endpoint, handler, config) {
    const middleware = yield middlewareFor(endpoint, config);
    const app = buildServer(endpoint, handler, middleware);

    const server = require('http').createServer(app);

    return server;
  });

  return function build(_x5, _x6, _x7) {
    return _ref2.apply(this, arguments);
  };
}();

exports.build = build;
exports.middlewareFor = middlewareFor;