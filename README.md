# About

This repository contains a library for interacting with the Aikon marketplace.

It wraps the [Open Rights Exchange protocol](https://github.com/api-market/protocol) to simplify the buying and selling of APIs in the marketplace.

# Usage

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
