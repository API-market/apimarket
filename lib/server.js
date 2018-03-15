const { instrument, right, verifier, capability, condition } = require('open-rights-exchange')
const connect = require('connect')

const verifierPublicKeyFromConfig = (config) => {
  return config.verifier.publicKey
}

const fromRegistry = (config) => {
  const registry = config.registry
  const names = Object.keys(registry)

  if (names.length !== 1) {
    throw new Error('only one offer is currently supported')
  }

  const key = names[0]
  return registry[key]
}

const apiEndpointFromConfig = (config) => {
  return fromRegistry(config).endpoint
}

const instrumentAddressFromConfig = (config) => {
  return fromRegistry(config).offerAddress
}

const Web3 = require('web3')

const connectWeb3 = ({endpoint}) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(endpoint))
  return web3
}

const ipfsAPI = require('ipfs-api')
const { URL } = require('url')

const connectIPFS = ({endpoint}) => {
  const url = new URL(endpoint)
  const ipfs = ipfsAPI({
    host: url.host,
    port: url.port,
    protocol: url.protocol
  })
  return ipfs
}

const middlewareFor = async (config, web3, ipfs) => {
  if (web3 === undefined) {
    web3 = connectWeb3(config.services.web3)
  }
  if (ipfs === undefined) {
    ipfs = connectIPFS(config.services.ipfs)
  }

  const instrumentAddress = instrumentAddressFromConfig(config)
  const apiEndpoint = apiEndpointFromConfig(config)

  const offer = await instrument.at(instrumentAddress)

  const [ voucherRight ] = instrument.searchRights(offer, capability.forAPI({apiEndpoint}))

  if (!voucherRight) {
    throw new Error(`the instrument address ${instrumentAddress} cannot support an API voucher`)
  }

  const [ paymentChannelCondition ] = right.findProperties(voucherRight, condition.forPaymentChannel())

  const { verifytokenEndpoint } = condition.properties(paymentChannelCondition)

  const verifierPublicKey = verifierPublicKeyFromConfig(config)

  const jwtMiddleware = verifier.middlewareDecodesJWT(verifierPublicKey)
  const addressMiddleware = verifier.middlewareMatchesInstrumentAddress(instrumentAddress)
  const acceptTokenMiddleware = verifier.middlewareExpectsPaymentChannelToken(verifytokenEndpoint)

  const chain = connect()
  [jwtMiddleware, addressMiddleware, acceptTokenMiddleware].forEach(chain.use)

  return chain
}
exports.middlewareFor

const express = require('express')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const buildServer = (endpoint, handler, ...middlewares) => {
  const app = express()

  app.use(logger('dev'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(cookieParser())

  for (let middleware of middlewares) {
      app.use(middleware)
  }

  const path = new URL(endpoint).pathname
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

const build = async (handler, config) => {
  const middleware = await middlewareFor(config)

  const apiEndpoint = apiEndpointFromConfig(config)

  const app = buildServer(apiEndpoint, handler, middleware)

  const server = require('http').createServer(app);

  return server
}
exports.build = build