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

  async getUrlAndAccessToken(apiVoucher, apiRight) {
    // Call Verifier contract eos.contract(‘verifier’).then(verifierContract =>      verifierContract.issueAccessToken(apiVoucherId)) =>  url, accessToken
    /*
    // TODO require ecc lib
    // TODO Send the correct params (rightName, signature, requestsParams defined in right, voucher)
    const options = {
      method: 'POST',
      body: JSON.stringify({
        rightName:
        signature: ecc.sign(apiVoucher.id.toString(), config.keyProvider),
        voucherId: apiVoucher.id
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    */
    //const {url, accessToken} = await fetch(VERIFIER_URI, options)
    let url = "https://hadron.aikon.com"
    let accessToken = ''
    return {url, accessToken}
  }

  async callApiEndpoint(url, body, accessToken) {
    // Makes request to url with accessToken marked ore-authorization in header and returns results
    const options =  {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken
      }
    }

    const response = await fetch(url, options)
    return response
  }

  async fetch(apiName, data) {
    console.log("Fetch:", apiName)
    const {apiVoucher, apiRight} = await this.getApiVoucherAndRight(apiName)
    // TODO Send the correct URL params
    console.log("Voucher:", apiVoucher)
    console.log("Right:", apiRight)

    // Call cpuContract.approve(oreAccountName, cpuAmount) to designate amount to allow payment in cpu for the api call (from priceInCPU in the apiVoucher’s right for the specific endpoint desired)
    await this.orejs.approveCpu(this.config.oreAccountName, VERIFIER_ACCOUNT_NAME, apiRight.price_in_cpu)
    console.log("Approved!")

    const {url, accessToken} = await this.getUrlAndAccessToken(apiVoucher, apiRight)
    console.log("Url:", url)

    const response = await await this.callApiEndpoint(url, data, accessToken)
    console.log("Response:", response)
    return response.json()
  }
}

module.exports = {
  Client
}
