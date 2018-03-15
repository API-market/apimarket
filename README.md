# About

This repository contains a library for interacting with the Aikon marketplace.

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

const result = await client.fetch("io.hadron.deepspace", hadronRequest)
console.log(result)
```

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

## Miscellaneous -- ignore this unless internal

To purchase the voucher behind an offer:

```javascript
const aikon = require('aikon')

let offerAddress // e.g. from aikon.com

const voucherAddress = await aikon.purchase(offerAddress, {web3, ipfs, transactionParameters, cpuContractAddress})
```

To get an HTTP client specialized for calling the API behind the voucher:

```javascript
const client = await aikon.open(voucherAddress, {web3, ipfs, transactionParameters})
```

The client created will accept a request object according to the OpenAPI spec included with the API's documentation.

```javascript
// for some API that increments a number by 1...

const fetches = [1, 2, 3].map(n => client.fetch({n}))

const results = await Promise.all(fetches)

console.log(results) // => [2, 3, 4]
```

If you have already purchased the voucher but do not have its address you can recover the API client from the offer address and the address you used to purchase the voucher.

```javascript
const client = await aikon.load(offerAddress, userAddress, {web3, ipfs, transactionParameters})
```
