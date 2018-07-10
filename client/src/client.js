const fs = require('fs')
const fetch = require('node-fetch')
const {Orejs, crypto} = require('orejs')
const ecc = require('eosjs-ecc')
const VOUCHER_CATEGORY = "apimarket.apiVoucher"
const VERIFIER_ACCOUNT_NAME = "verifier.ore"
const VERIFIER_URI = "https://verifier-staging-dot-open-rights-exchange.appspot.com/verify"

class Client {
  constructor(config) {
    this.config = config
    this.keys = JSON.parse(fs.readFileSync(__dirname + config.keyFilePath))
    this.keyProvider = [crypto.decrypt(this.keys.privateKey.toString(), this.keys.walletPassword)]
    this.orejs = new Orejs({
      httpEndpoint: config.oreNetworkUri,
      keyProvider: this.keyProvider,
      oreAuthAccountName: this.keys.oreAccountName,
      sign: true
    })

  }

  async getOptions(endpoint, httpMethod, oreAccessToken, requestParams){
    let options
    let url
    if(httpMethod.toLowerCase() == "post"){
      options =  {
        method: httpMethod,
        body: JSON.stringify(requestParams),
        headers: {
          'Content-Type': 'application/json',
          'Ore-Access-Token': oreAccessToken
        }
      }
      url = endpoint
    }
    else
    {
      options =  {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Ore-Access-Token': oreAccessToken
        }
      }
      url = new URL(endpoint)
      Object.keys(requestParams).forEach(key => url.searchParams.append(key, requestParams[key]))
    }
    return {url,options}
  }

  async getApiVoucherAndRight(apiName) {
    // Call orejs.findInstruments(oreAccountName, activeOnly:true, args:{category:’apiMarket.apiVoucher’, rightName:’xxxx’}) => [apiVouchers]
    const apiVouchers = await this.orejs.findInstruments(this.keys.oreAccountName, true, VOUCHER_CATEGORY, apiName)
    // Choose one voucher - rules to select between vouchers: use cheapest priced and then with the one that has the earliest endDate
    const apiVoucher = apiVouchers.sort((a, b) => {
      const rightA = this.orejs.getRight(a, apiName)
      const rightB = this.orejs.getRight(b, apiName)
      return rightA.price_in_cpu - rightB.price_in_cpu || a.instrument.start_time - b.instrument.end_time
    })[0]
    const apiRight = this.orejs.getRight(apiVoucher, apiName)
    return {apiVoucher, apiRight}
  }

  async getUrlAndAccessToken(apiVoucher, apiRight, requestParams) {
    // Call Verifier to get access token
    const signature = await this.orejs.signVoucher(apiVoucher.id)
    const options = {
      method: 'POST',
      body: JSON.stringify({
        requestParams: requestParams,
        rightName: apiRight.right_name,
        signature: signature,
        voucherId: apiVoucher.id
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    const result= await fetch(VERIFIER_URI, options)
    
    const {endpoint, oreAccessToken, method} = await result.json()
    return {endpoint, oreAccessToken, method}
  }

  async callApiEndpoint(endpoint, httpMethod, requestParams, oreAccessToken) {
    // Makes request to url with accessToken marked ore-authorization in header and returns results
    const {url, options} = await this.getOptions(endpoint, httpMethod, oreAccessToken, requestParams)
    const response = await fetch(url, options)
    return response
  }

  async fetch(apiName, requestParams) {
    console.info("Fetch:", apiName)
    const {apiVoucher, apiRight} = await this.getApiVoucherAndRight(apiName)
    console.info("Voucher:", apiVoucher)
    console.info("Right:", apiRight)

    // Call cpuContract.approve(oreAccountName, cpuAmount) to designate amount to allow payment in cpu for the api call (from priceInCPU in the apiVoucher’s right for the specific endpoint desired)
    await this.orejs.approveCpu(this.keys.oreAccountName, VERIFIER_ACCOUNT_NAME, apiRight.price_in_cpu)
    console.info("Approved!")

    // Call the verifier to get the access token
    const {endpoint, oreAccessToken, method} = await this.getUrlAndAccessToken(apiVoucher, apiRight, requestParams)
    console.info("Url:", endpoint)

    // Call the api
    const response = await this.callApiEndpoint(endpoint, method, requestParams, oreAccessToken)
    console.info("Response:", response)
    return response.json()
  }
}

module.exports = {
  Client
}
