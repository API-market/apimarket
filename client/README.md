# About

This repository contains a library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/ore-protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

## Client

The `apimarket_config.json` is the keyfile which stores the address to connect to the ORE blockchain. It also stores the verifierAuthKey which is used to authrorize verifier to transfer the CPU amount from user's account to API provider's account for the API call. You can download this file from the api.market website.

IMPORTANT: The verifierAuthKey cannot be used for any other functions such as CPU transfer. It can only be used to authrorize verifier. 

An example configuration file looks like:
```json
{
  "accountName": "ajscf...",
  "verifierAuthKey": "U2Fsd...",
  "verifier": "https...",
  "verifierAccountName": "verif..."
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
