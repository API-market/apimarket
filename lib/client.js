const CryptoJS = require("crypto-js")
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

    // TODO handoff to orejs, once we have modules
    let bytes = CryptoJS.AES.decrypt(this.keys.privateKey.toString(), this.keys.walletPassword)
    this.keyProvider = bytes.toString(CryptoJS.enc.Utf8)

    this.orejs = new Orejs({
      httpEndpoint: config.oreNetworkUri,
      keyProvider: this.keyProvider,
      oreAuthAccountName: this.keys.oreAccountName,
      sign: true
    })
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
    // Call Verifier contract eos.contract(‘verifier’).then(verifierContract =>      verifierContract.issueAccessToken(apiVoucherId)) =>  url, accessToken
    const options = {
      method: 'POST',
      body: JSON.stringify({
        requestParams: requestParams,
        rightName: apiRight.right_name,
        signature: ecc.sign(apiVoucher.id.toString(), this.keyProvider),
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

  async callApiEndpoint(url, httpMethod, requestParams, oreAccessToken) {
    // Makes request to url with accessToken marked ore-authorization in header and returns results
    const options =  {
      method: httpMethod,
      body: JSON.stringify(requestParams),
      headers: {
        'Content-Type': 'application/json',
        'Ore-Access-Token': oreAccessToken
      }
    }

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

    const {url, oreAccessToken, httpMethod} = await this.getUrlAndAccessToken(apiVoucher, apiRight, requestParams)
    console.info("Url:", url)

    const response = await this.callApiEndpoint(url, httpMethod, requestParams, oreAccessToken)
    console.info("Response:", response)
    return response.json()
  }
}

module.exports = {
  Client
}
