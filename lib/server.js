const { instrument, right, verifier, capability, condition } = require('open-rights-exchange')
const connect = require('connect')

const { connectIPFS } = require('./ipfs')
const { connectWeb3 } = require('./web3')

const verifierPublicKeyFromConfig = (config) => {
  return config.verifier.publicKey.replace(/\\n/g, '\n')
}

const fromRegistry = (config, endpoint) => {
  const registry = config.registry
  const names = Object.keys(registry)

  if (names.length !== 1) {
    throw new Error('only one offer is currently supported')
  }

  const key = names[0]
  const scope = registry[key]
  return scope[endpoint]
}
exports.fromRegistry = fromRegistry

const instrumentAddressFromConfig = (endpoint, config) => {
  return fromRegistry(config, endpoint).offer.address
}

const middlewareFor = async (endpoint, config, web3, ipfs) => {
  if (web3 === undefined) {
    web3 = connectWeb3(config.services.web3.endpoint)
  }
  if (ipfs === undefined) {
    ipfs = connectIPFS(config.services.ipfs.endpoint)
  }

  const instrumentAddress = instrumentAddressFromConfig(endpoint, config)

  const offer = await instrument.at(instrumentAddress, {web3, ipfs})

  const [ voucherRight ] = instrument.searchRights(offer, capability.forAPI({apiEndpoint: endpoint}))

  if (!voucherRight) {
    throw new Error(`the instrument address ${instrumentAddress} cannot support an API voucher`)
  }

  const verifierPublicKey = verifierPublicKeyFromConfig(config)

  const jwtMiddleware = verifier.middlewareDecodesJWT(verifierPublicKey)

  const verifyRequestMiddleware = verifier.middlewareDecodesRequest(endpoint)

  const chain = connect()
  const middlewares = [jwtMiddleware, verifyRequestMiddleware]
  middlewares.forEach(m => chain.use(m))

  return chain
}
exports.middlewareFor

const express = require('express')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
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
