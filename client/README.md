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

// call api - passing in the parameters it needs
// you specify the api to call using it's unique name registered on the ORE blockchain
// pass the query parameters as http-url-params and the body parameters as http-body-params if both query and body parameters // exist. Otherwise just pass the parameters to the apimarketClient.fetch directly.
// example: const params =  {"httpBodyParams": {
//   "imageurl": "https://console.cloud.google.com/storage/browser/apimarket-contest-2018-07-1-coffee/10465_full_jpg.jpg"
//   },
//   "httpUrlParams": {
//     "env": "staging"
//   }
// }

// if only query or body parameters exist, pass them directly to apimarketClient.fetch
const params = {"imageurl":"https://console.cloud.google.com/storage/browser/apimarket-contest-2018-07-1-coffee/10465_full_jpg.jpg"}
const response = await apimarketClient.fetch("cloud.hadron.contest-2018-07", params)

//View results
console.log(response)

```

# Publish NPM Package

To publish an updated package, first log-in to npmjs with `npm login` (using account apimarket)

- Update version number in package.json (and example's package.json)
- `npm publish --tag staging` - to publish staging version
- `npm publish` - to publish the production version

package name will be: @apimarket/apimarket@{version}
