# About

This repository contains a library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/ore-protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

## Server

With the verifier public key in the env file, supply an Express-style HTTP handler that services your API.

```
VERIFIER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMFkw....==\n-----END PUBLIC KEY-----"
```

Only valid requests will be served

```javascript
const { apiMarketRequestValidator } = require('@apimarket/apimarket-server')

app.use(apiMarketRequestValidator())

```

# Publish NPM Package

- Update version number in package.json
- `npm publish --tag staging` - to publish staging version
- `npm publish` - to publish the production version

package name will be: @apimarket/apimarket-server@{version}
