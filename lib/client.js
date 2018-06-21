const ecc = require('eosjs-ecc')
const fs = require('fs')
const fetch = require('node-fetch')
const {Orejs} = require('orejs')

const VOUCHER_CATEGORY = "apim.apiVoucher"
const VERIFIER_ACCOUNT_NAME = "ore.verifier"
const VERIFIER_URI = ""

class Client {
  constructor(config) {
    this.config = config
    this.keys = JSON.parse(fs.readFileSync(__dirname + config.keyFilePath))
    this.orejs = new Orejs({
      httpEndpoint: config.httpEndpoint,
      keyProvider: config.keyProvider,
      oreAuthAccountName: config.oreAccountName,
      sign: true
    })
  }

  getApiRight(apiVoucher, rightName) {
    const rights = apiVoucher.instrument.rights
    for (let i = 0; i < rights.length; i++) {
      let right = rights[i]
      if (right.right_name === rightName) {
        return right
      }
    }
  }

  async getApiVoucherAndRight(apiName) {
    // Call orejs.findInstruments(oreAccountName, activeOnly:true, args:{category:’apiMarket.apiVoucher’, rightName:’xxxx’}) => [apiVouchers]
    const apiVouchers = await this.orejs.findInstruments(this.config.oreAccountName, true, VOUCHER_CATEGORY, apiName)

    // Choose one voucher - rules to select between vouchers: use cheapest priced and then with the one that has the earliest endDate
    const apiVoucher = apiVouchers.sort((a, b) => {
      const rightA = this.getApiRight(a, apiName)
      const rightB = this.getApiRight(b, apiName)
      return rightA.price_in_cpu - rightB.price_in_cpu || a.instrument.start_time - b.instrument.end_time
    })[0]
    const apiRight = this.getApiRight(apiVoucher, apiName)
    return {apiVoucher, apiRight}
  }

  async getUrlAndAccessToken(apiVoucher, apiRight, requestParams) {
    // Call Verifier contract eos.contract(‘verifier’).then(verifierContract =>      verifierContract.issueAccessToken(apiVoucherId)) =>  url, accessToken
    const options = {
      method: 'POST',
      body: JSON.stringify({
        requestParams: requestParams,
        rightName: apiRight.right_name,
        signature: ecc.sign(apiVoucher.id.toString(), this.config.keyProvider),
        voucherId: apiVoucher.id
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    // TODO Request the url & accessToken from the verifier
    //const {url, oreAccessToken, httpMethod} = await fetch(VERIFIER_URI, options)
    let url = "https://hadron.aikon.com"
    let oreAccessToken = ''
    let httpMethod = 'POST'
    return {url, oreAccessToken, httpMethod}
  }

  async callApiEndpoint(url, httpMethod, requestParams, accessToken) {
    // Makes request to url with accessToken marked ore-authorization in header and returns results
    const options =  {
      method: httpMethod,
      body: JSON.stringify(requestParams),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken
      }
    }

    const response = await fetch(url, options)
    return response
  }

  async fetch(apiName, requestParams) {
    console.log("Fetch:", apiName)
    const {apiVoucher, apiRight} = await this.getApiVoucherAndRight(apiName)
    console.log("Voucher:", apiVoucher)
    console.log("Right:", apiRight)

    // Call cpuContract.approve(oreAccountName, cpuAmount) to designate amount to allow payment in cpu for the api call (from priceInCPU in the apiVoucher’s right for the specific endpoint desired)
    await this.orejs.approveCpu(this.config.oreAccountName, VERIFIER_ACCOUNT_NAME, apiRight.price_in_cpu)
    console.log("Approved!")

    const {url, oreAccessToken, httpMethod} = await this.getUrlAndAccessToken(apiVoucher, apiRight, requestParams)
    console.log("Url:", url)

    const response = await this.callApiEndpoint(url, httpMethod, requestParams, oreAccessToken)
    console.log("Response:", response)
    return response.json()
  }
}

module.exports = {
  Client
}
