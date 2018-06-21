const asyncHandler = require('express-async-handler')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const fetch = require('node-fetch')
const fs = require('fs')
const logger = require('morgan')
const http = require('http')
const ecc = require('eosjs-ecc')
const jwt = require('jsonwebtoken')
const sortJson = require('sort-json')
const ORE_PUBLIC_KEY = ''

class Server {
  constructor(config) {
    this.config = { ...config, ...JSON.parse(fs.readFileSync(__dirname + config.configFilePath)) }
  }

  buildServer(handler, middlewareDecodeJwt, middlewareCheckTokenHash) {
    const app = express()

    app.use(logger('dev'))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(cookieParser())

    app.use(middlewareDecodeJwt)

    app.use(middlewareCheckTokenHash)

    app.post('/', handler)

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

  decodeJWT() {
    return async (req, res, next) => {
      const verifierPublicKey = this.config.verifier.publicKey.replace(/\\n/g, '\n')
      const token = req.get('oreAcessToken')

      try {
        const payload = jwt.verify(token, verifierPublicKey, {
          algorithms: ["ES256"]
        })
        next()
      } catch (e) {
        res.status(401).json({message: "unauthorized"})
      }
    }
  }

  middlewareDecodeJwt() {
    return this.decodeJWT()
  }
  
  checkHash() {
    return async (req, res, next) => {
      const reqHash = req.get('reqParamHash')
      const requestParams = req.body
      try {
        const sortedRequestParams = sortJson(requestParams)
        const hash = ecc.sha256(JSON.stringify(sortedReqParams))
        if(hash === reqHash)
          next()
      } catch (e) {
        res.status(401).json({message: "unauthorized"})
      }
    }
  }

  middlewareCheckTokenHash() {
    return this.checkHash()
  }
  async httpServer(handler) {
    const middlewareDecodeJwt = await this.middlewareDecodeJwt()
    const middlewareCheckTokenHash = await this.middlewareCheckTokenHash()
    const app = this.buildServer(handler, middlewareDecodeJwt, middlewareCheckTokenHash)
    const server = http.createServer(app);
    return server
  }
}

module.exports = {
  Server
}
