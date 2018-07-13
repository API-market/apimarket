require('dotenv').config()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const fetch = require('node-fetch')
const honey = require(__dirname + "/honey")
const analyticsEvent = require(__dirname + "/segment")
const logger = require('morgan')
const http = require('http')
const ecc = require('eosjs-ecc')
const jwt = require('jsonwebtoken')
const sortJson = require('sort-json')
const ORE_PUBLIC_KEY = ''
const Base64 = require('js-base64').Base64;

class Server {
  constructor(verifierPublicKey) {
    this.verifierPublicKey = verifierPublicKey
  }

  buildServer(handler, middlewareDecodeJwt, middlewareCheckTokenHash) {
    const app = express()

    app.use(logger('dev'))
    app.use(honey())
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
      const verifierPublicKey = this.verifierPublicKey.replace(/\\n/g, '\n')
      const accessToken = req.headers['ore-access-token']
      const accessTokenHash = ecc.sha256(JSON.stringify(accessToken))
      const ip = req.connection.remoteAddress || req.headers['x-forwarded-for']

      try{
        analyticsEvent(ip,"request details", {accessTokenHash})
      } catch (e) {
        throw e
      }

      //hash the access token and make that the user id in the segment
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
        let requestParams
        if(JSON.stringify(req.query) === JSON.stringify({})){
          requestParams = req.body
        } else{
          requestParams = req.query
        }
        
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
        res.status(401).json({message: "the request parameters sent to the api server are differnet from thise sent to the verifier"})
      }
    }
  }

  middlewareCheckTokenHash() {
    return this.checkHash()
  }

  // TODO: change the middleware name and combine them
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
