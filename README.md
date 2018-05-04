# About

This repository contains a library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

## Server

With a similar key file and config, supply an Express-style HTTP handler that services your API.

```json
{
  "registry": {
    "io.hadron.deepspace": {
      "endpoint": "https://...",
      "offerAddress": "0x..."
    }
  },
  "verifier": {
    "publicKey": "<...>"
  },
  "services": {
    "web3": {
      "endpoint": "ganache1.api.market:8545"
    },
    "ipfs": {
      "endpoint": "ipfs.api.market:5001"
    }
  }
}
```

Only valid requests will be served and middleware in this library will handle the payments.

```javascript
const fs = require('fs')
const aikon = require('aikon')

let configFilePath
const config = JSON.parse(fs.readSync(configFilePath))

const server = aikon.initServer(handler, config)

server.listen(port)
```

# Publish NPM Package

- Update version number in package.json
- `npm publish`

   package name will be: @apimarket/apimarket@{version}