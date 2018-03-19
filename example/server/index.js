const { initServer } = require('../../index')

const fs = require('fs')

const configFilePath = '/config.json'
const config = JSON.parse(fs.readFileSync(__dirname + configFilePath))

const port = process.env.PORT || 8080

const handler = async (req, res) => {
  res.json({x: req.body.x + 1})
}

const run = async (port, handler, config) => {
  const server = await initServer(handler, config)

  server.listen(port, () => console.log(`listening on port: ${port}`))
}

run(port, handler, config)
