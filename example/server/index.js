const {Server} = require('../../index')

const PORT = process.env.PORT || 8080

const run = async () => {
  let server = new Server({
    configFilePath: "/../example/server/config.json"
  })

  const handler = async (req, res) => {
    res.json({x: req.body.requestParams.x + 1})
  }

  const httpServer = await server.httpServer(handler)
  httpServer.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
}

run()
