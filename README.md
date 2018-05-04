# About

This repository contains a client library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

## Client

The `keyFile` is a key in the [well-known format](https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition) as used by Geth and other Ethereum implementations.

An example configuration file looks like:

```json
{
  "registry": {
    "io.hadron.deepspace": {
      "voucher" : {
        "address": "0x..."
      }
    }
  },
  "services": {
    "web3": {
      "endpoint": "ganache1.api.market"
    },
    "ipfs": {
      "endpoint": "ipfs.api.market"
    }
  }
}
```

Then, in your client code:

```javascript
const fs = require('fs')
const aikon = require('aikon')

let configFilePath
const config = JSON.parse(fs.readSync(configFilePath))

const client = aikon.init(config)

const result = await client.fetch("io.hadron.spaceTelescope", hadronRequest)
console.log(result)
```

# Publish NPM Package

- Update version number in package.json
- `npm publish`

   package name will be: @apimarket/apimarket@{version}
