# About

This repository contains a library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/ore-protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

## Client

The `apimarket_config.json` is the keyfile which stores your encrypted wallet information and the address to connect to the ORE blockchain. You can download this file from the api.market website. After you download it, you'll need to add the password you used to create the wallet on api.market. 

IMPORTANT: We don't have your wallet's unencrytped private key and we never store your wallet password.

An example configuration file looks like:
```json
{
    "walletPassword": "PW5Kb...",
    "accountName": "sjvch...",
    "accountPrivateKeyEncrypted": "U2Fsd...",
    "publicKey": "EOS74...",
    "verifier": "https://verifier....com",
    "verifierAccountName": "verifier.ore"
}
```

To call an ORE-enabled API, use the config file, connect to the ORE blockchain and make the request. Here is some fully-functional sample code:

```javascript
const { ApiMarketClient } = require('@apimarket/apimarket')
const config = require("apimarket_config.json");

//Setup and connect to the blockchain using your wallet and password in the config
let apimarketClient = new ApiMarketClient(config);
await apimarketClient.connect()

//call api - passing in the data it needs
//you specify the api to call using it's unique name registered on the ORE blockchain
const data = {"imageurl":"jc9r05010_drz_small.jpg"}
const response = await apimarketClient.fetch("cloud.hadron.contest-2018-07", data)

//View results
console.log(response)

```

# Publish NPM Package

To publish an updated package, first log-in to npmjs with `npm login` (using account apimarket)

- Update version number in package.json (and example's package.json)
- `npm publish --tag staging` - to publish staging version
- `npm publish` - to publish the production version

package name will be: @apimarket/apimarket@{version}
