# About

This repository contains a library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/ore-protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

## Client

The `config.json` is the keyfile which stores the client wallet password, account name, encrypted  private key and public key. It also stores the address and ore account name of the verifier.

An example configuration file looks like:

```json
{
    "walletPassword": "PW5Kb...",
    "oreAccountName": "sjvch...",
    "privateKey": "U2Fsd...",
    "publicKey": "EOS74..."
}
```

Then, in your client code:

```javascript
const Client = require('@apimarket/apimarket')

const client = new Client()

await client.connect()

const result = await client.fetch("io.hadron.spaceTelescope", hadronRequest)
console.log(result)
```

# Publish NPM Package

- Update version number in package.json
- `npm publish --tag staging` - to publish staging version
- `npm publish` - to publish the production version

package name will be: @apimarket/apimarket@{version}