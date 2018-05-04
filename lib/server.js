const connect = require('connect')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const honey = require('./honey')
const verifierPublicKeyFromConfig = (config) => {
  return config.verifier.publicKey.replace(/\\n/g, '\n')
}

const middlewareDecodesJWT = (publicKey) => {
  return async (req, res, next) => {
    const token = req.get('Authorization')

    try {
      const payload = jwt.verify(token, publicKey, {
        algorithms: ["ES256"]
      })
      req.openRightsExchangeTokenPayload = payload
      next()
    } catch (e) {
      res.status(401).json({message: "unauthorized"})
    }
  }
}

exports.middlewareDecodesJWT = middlewareDecodesJWT

const middlewareDecodesRequest = (endpoint) => {
  return async(req, res, next) => {
    const { apiEndpoint, requestBody } = req.openRightsExchangeTokenPayload
    
    if (endpoint !== apiEndpoint || !_.isEqual(req.body, requestBody)) {
      res.status(401).json({message: 'the voucher is not valid for the requested endpoint', requestBody: requestBody, req: req, apiEndpoint: apiEndpoint})
      return
    }
    next()
  }
}

exports.middlewareDecodesRequest = middlewareDecodesRequest

const middlewareFor = async (endpoint, config) => {

  const verifierPublicKey = verifierPublicKeyFromConfig(config)

  const jwtMiddleware = middlewareDecodesJWT(verifierPublicKey)

  const verifyRequestMiddleware = middlewareDecodesRequest(endpoint)

  const chain = connect()
  chain.use(honey())
  chain.use(bodyParser.json())
  chain.use(bodyParser.urlencoded({ extended: false }))
  chain.use(cookieParser())
  const middlewares = [jwtMiddleware, verifyRequestMiddleware]
  middlewares.forEach(m => chain.use(m))

  return chain
}

exports.middlewareFor

const express = require('express')
const logger = require('morgan')
const url = require('url')

const buildServer = (endpoint, handler, ...middlewares) => {
  const app = express()

  app.use(logger('dev'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())

  for (let middleware of middlewares) {
      app.use(middleware)
  }

  //const path = new URL(endpoint).pathname
  const path = url.parse(endpoint).pathname
  app.post(path, handler)

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
  })

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.json({
      message: err.message,
      error: err
    })
  })

  return app
}

const build = async (endpoint, handler, config) => {
  const middleware = await middlewareFor(endpoint, config)

  const app = buildServer(endpoint, handler, middleware)

  const server = require('http').createServer(app);

  return server
}
exports.build = build
exports.middlewareFor = middlewareFor
