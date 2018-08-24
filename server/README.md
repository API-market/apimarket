# About

This repository contains a library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/ore-protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

## Server
There are 2 ways to use this library. Both of the methods require verifier public key in the following format in the env file

```
VERIFIER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMFkw....==\n-----END PUBLIC KEY-----"
```

### As an express middleware
With the verifier public key in the env file, supply an Express-style HTTP handler that services your API. Only valid requests will be served

```javascript
const { apiMarketRequestValidator } = require('@apimarket/apimarket-server')

app.use(apiMarketRequestValidator())

```

### As a javascript function from the library
With the verifier public key in the env file, use the checkOreAccessToken function of the library

```javascript
const { apiMarketRequestValidator } = require('@apimarket/apimarket-server')

const isValidOreAcessToken = await checkOreAccessToken(req.headers['ore-access-token'], req)
```

# Publish NPM Package

- Update version number in package.json
- `npm publish --tag staging` - to publish staging version
- `npm publish` - to publish the production version

package name will be: @apimarket/apimarket-server@{version}
