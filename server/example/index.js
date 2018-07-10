require('newrelic')
require('dotenv').config()
const {Server} = require('../index')

const PORT = process.env.PORT || 8080

const run = async () => {
  let server = new Server(process.env.VERIFIER_PUBLIC_KEY)

  const handler = async (req, res) => {
    res.json({x: req.body.x + 1})
  }

  const httpServer = await server.httpServer(handler)
  httpServer.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
}

run()
