"use strict";

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

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

const instrumentAddressFromConfig = (endpoint, config) => {
  return fromRegistry(config, endpoint).offer.address;
};

const middlewareFor =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (endpoint, config) {
    const instrumentAddress = instrumentAddressFromConfig(endpoint, config);
    const offer = yield instrument.at(instrumentAddress);
    const [voucherRight] = instrument.searchRights(offer, capability.forAPI({
      apiEndpoint: endpoint
    }));

    if (!voucherRight) {
      throw new Error(`the instrument address ${instrumentAddress} cannot support an API voucher`);
    }

    const verifierPublicKey = verifierPublicKeyFromConfig(config);
    const jwtMiddleware = verifier.middlewareDecodesJWT(verifierPublicKey);
    const verifyRequestMiddleware = verifier.middlewareDecodesRequest(endpoint);
    const chain = connect();
    const middlewares = [jwtMiddleware, verifyRequestMiddleware];
    middlewares.forEach(m => chain.use(m));
    return chain;
  });

  return function middlewareFor(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

const express = require('express');

const logger = require('morgan');

const cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');

const url = require('url');

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

  return function build(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

exports = {
  build: build,
  fromRegistry: fromRegistry,
  middlewareFor: middlewareFor
};