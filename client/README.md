# About

This repository contains a library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/ore-protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

## Client

The `apimarket_keyfile.json` is the keyfile which stores the client wallet password, account name, encrypted private key and public key.

An example configuration file looks like:

```json
{
    "walletPassword": "PW5KbD3vhXn4XHa1cr8PVXVZyEk9XXKG3tAfeWB2gQX6qV1nQM3Nh",
    "oreAccountName": "test2.apim",
    "privateKey": "U2FsdGVkX19At7rExyqekKr4bjVjnsC9bu6mPtgvfYxAZsOz5OHtC4Hz9i8ztG5E9bcnuylBLHUsQ71sgqvpp4KPZxOVWmI8hXfRm/NdMUQ=",
    "publicKey": "public:EOS74kTV4S7Hw6c9Y3Z87HYQniSjMuuTHXGVGcwD5kjtMeESYHr9i"
}
```

Then, in your client code:

```javascript
const fs = require('fs')
const Client = require('@apimarket/apimarket')

let configFilePath
const config = JSON.parse(fs.readSync(configFilePath))

const client = new Client(config)

const result = await client.fetch("io.hadron.spaceTelescope", hadronRequest)
console.log(result)
```

# Publish NPM Package

- Update version number in package.json
- `npm publishstaging` - to publish staging version
- `npm publish` - to publish the production version

   package name will be: @apimarket/apimarket@{version}