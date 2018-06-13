const asyncHandler = require('express-async-handler')
const bodyParser = require('body-parser')
const connect = require('connect')
const cookieParser = require('cookie-parser')
const express = require('express')
const fetch = require('node-fetch')
const fs = require('fs')
const logger = require('morgan')
const http = require('http')
const jwt = require('jsonwebtoken')
const url = require('url')

const ORE_PUBLIC_KEY = ''

class Server {
  constructor(config) {
    this.config = { ...config, ...JSON.parse(fs.readFileSync(__dirname + config.configFilePath)) }
  }

  buildServer(endpoint, handler, ...middlewares) {
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

  decodeJWT() {
    return async (req, res, next) => {
      const token = req.get('Authorization')

      try {
        const payload = jwt.verify(token, ORE_PUBLIC_KEY, {
          algorithms: ["ES256"]
        })
        req.openRightsExchangeTokenPayload = payload
        next()
      } catch (e) {
        res.status(401).json({message: "unauthorized"})
      }
    }
  }

  middlewareFor(endpoint) {
    const jwtMiddleware = this.decodeJWT()

    const chain = connect()
    const middlewares = [jwtMiddleware]
    middlewares.forEach(m => chain.use(m))

    return chain
  }

  httpServer(endpoint, handler) {
    const middleware = await this.middlewareFor(endpoint)
    const app = this.buildServer(endpoint, handler, middleware)
    const server = http.createServer(app);
    return server
  }
}

module.exports = {
  Server
}
