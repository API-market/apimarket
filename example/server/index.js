const {Server} = require('../../index')

const run = async () => {
  let server = new Server({
    configFilePath: "/../example/server/config.json"
  })

  const port = process.env.PORT || 8080

  // in this example, we run a local server that is essentially a proxy, this name is used to select the right offer data, the remote endpoints are listed in the configuration
  const endpoint = "http://sandbox.dev.aikon.com:3405/"

  const handler = async (req, res) => {
    res.json({x: req.body.x + 1})
  }

  try {
    const httpServer = await server.http(endpoint, handler)
    httpServer.listen(port, () => console.log(`listening on port: ${port}`))
  } catch(err) {
    console.error(err)
  }
  process.exit(0)
}

run()
