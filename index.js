const client = require('lib/client')
const server = require('lib/server')

// this function is exposed so API providers can build their own server, injecting this middleware as appropriate
exports.middlewareFor = server.middlewareFor

// returns an express server ready to `listen` on a `port`
exports.initServer = server.build
