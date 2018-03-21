import '@babel/polyfill'
const { initServer } = require('../../index')

const config = {
  "registry": {
    "io.hadron.spaceTelescope": {
      "endpoint": 'http://sandbox.dev.aikon.com:3405/',
      "offer": {
        "address": '0x19f9591fbe24b596434aaad7c80884a863a56b0e'
      }
    }
  },
  "verifier": {
    "publicKey": `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfy0YUA2nDgEIbOC2FxE6wygiNFUd
eH6vYfcHz+uioYq+GU81Axysh09GKhxsRu4OIK668BzCyw9DI/HDysTV2A==
-----END PUBLIC KEY-----`
  },
  "services": {
    "web3": {
      "endpoint": "http://ganache1.api.market:8545"
    },
    "ipfs": {
      "endpoint": "http://ipfs2-ext.dev.api.market:5001"
    }
  }
}

const port = process.env.PORT || 8080

const handler = async (req, res) => {
  res.json({x: req.body.x + 1})
}

const run = async (port, handler, config) => {
  const server = await initServer(handler, config)

  server.listen(port, () => console.log(`listening on port: ${port}`))
}

run(port, handler, config)
