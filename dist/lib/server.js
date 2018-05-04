"use strict";

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const connect = require('connect');

const jwt = require('jsonwebtoken');

const _ = require('lodash');

const cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');

const honey = require('./honey');

const verifierPublicKeyFromConfig = config => {
  return config.verifier.publicKey.replace(/\\n/g, '\n');
};

const middlewareDecodesJWT = publicKey => {
  return (
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(function* (req, res, next) {
        const token = req.get('Authorization');

        try {
          const payload = jwt.verify(token, publicKey, {
            algorithms: ["ES256"]
          });
          req.openRightsExchangeTokenPayload = payload;
          next();
        } catch (e) {
          res.status(401).json({
            message: "unauthorized"
          });
        }
      });

      return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    }()
  );
};

exports.middlewareDecodesJWT = middlewareDecodesJWT;

const middlewareDecodesRequest = endpoint => {
  return (
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(function* (req, res, next) {
        const {
          apiEndpoint,
          requestBody
        } = req.openRightsExchangeTokenPayload;

        if (endpoint !== apiEndpoint || !_.isEqual(req.body, requestBody)) {
          res.status(401).json({
            message: 'the voucher is not valid for the requested endpoint',
            requestBody: requestBody,
            req: req,
            apiEndpoint: apiEndpoint
          });
          return;
        }

        next();
      });

      return function (_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
      };
    }()
  );
};

exports.middlewareDecodesRequest = middlewareDecodesRequest;

const middlewareFor =
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(function* (endpoint, config) {
    const verifierPublicKey = verifierPublicKeyFromConfig(config);
    const jwtMiddleware = middlewareDecodesJWT(verifierPublicKey);
    const verifyRequestMiddleware = middlewareDecodesRequest(endpoint);
    const chain = connect();
    chain.use(honey());
    chain.use(bodyParser.json());
    chain.use(bodyParser.urlencoded({
      extended: false
    }));
    chain.use(cookieParser());
    const middlewares = [jwtMiddleware, verifyRequestMiddleware];
    middlewares.forEach(m => chain.use(m));
    return chain;
  });

  return function middlewareFor(_x7, _x8) {
    return _ref3.apply(this, arguments);
  };
}();

exports.middlewareFor;

const express = require('express');

const logger = require('morgan');

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
  var _ref4 = _asyncToGenerator(function* (endpoint, handler, config) {
    const middleware = yield middlewareFor(endpoint, config);
    const app = buildServer(endpoint, handler, middleware);

    const server = require('http').createServer(app);

    return server;
  });

  return function build(_x9, _x10, _x11) {
    return _ref4.apply(this, arguments);
  };
}();

exports.build = build;
exports.middlewareFor = middlewareFor;