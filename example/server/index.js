import '@babel/polyfill'
const { initServer } = require('../../index')

const fs = require('fs')

const configFilePath = '/config.json'
const config = JSON.parse(fs.readFileSync(__dirname + configFilePath))

const port = process.env.PORT || 8080

// in this example, we run a local server that is essentially a proxy, this name is used to select the right offer data, the remote endpoints are listed in the configuration
const endpoint = "http://sandbox.dev.aikon.com:3405/"

const handler = async (req, res) => {
  res.json({x: req.body.x + 1})
}

const run = async (endpoint, port, handler, config) => {
  const server = await initServer(endpoint, handler, config)

  server.listen(port, () => console.log(`listening on port: ${port}`))
}

run(endpoint, port, handler, config)
