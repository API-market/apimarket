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

  verifyJWT() {
    return async (req, res, next) => {
      const verifierPublicKey = this.config.verifier.publicKey.replace(/\\n/g, '\n')
      const accessToken = req.headers['ore-access-token']
      try {
        const payload = jwt.verify(accessToken, verifierPublicKey, {
          algorithms: ["ES256"]
        })
        if(payload){
          req.reqParamHash = payload["reqParamHash"]
          next()
        } else {
          throw e
        }
      } catch (e) {
        res.status(401).json({message: "unauthorized"})
      }
    }
  }

  middlewareVerifyJwt() {
    return this.verifyJWT()
  }
  
  checkHash() {
    return async (req, res, next) => {
      const requestParams = req.body
      const reqParamHash = req.reqParamHash

      try {
        const sortedReqParams = sortJson(requestParams)
    
        const hash = ecc.sha256(JSON.stringify(sortedReqParams))

        if(hash === reqParamHash){
          next()
        } else {
          throw e
        }
      } catch (e) {
        res.status(401).json({message: "unauthorized"})
      }
    }
  }

  middlewareCheckTokenHash() {
    return this.checkHash()
  }
  async httpServer(handler) {
    const middlewareVerifyJwt = await this.middlewareVerifyJwt()
    const middlewareCheckTokenHash = await this.middlewareCheckTokenHash()
    const middlewares = [middlewareVerifyJwt, middlewareCheckTokenHash]
    const app = this.buildServer(handler, ...middlewares)
    const server = http.createServer(app);
    return server
  }
}

module.exports = {
  Server
}
