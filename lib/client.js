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

  async fetch(apiName, data) {
    console.log("Request:", apiName)
    // Call orejs.findInstruments(oreAccountName, activeOnly:true, args:{category:’apiMarket.apiVoucher’, rightName:’xxxx’}) => [apiVouchers]
    const apiVouchers = await this.orejs.findInstruments(this.config.oreAccountName, true, VOUCHER_CATEGORY, apiName)

    // Choose one voucher - rules to select between vouchers: use cheapest priced and then with the one that has the earliest endDate
    const apiVoucher = apiVouchers.sort((a, b) => {
      const instrA = a.instrument
      const instrB = b.instrument
      const rightA = instrA.rights[0]
      const rightB = instrB.rights[0]
      return rightA.price_in_cpu - rightB.price_in_cpu || instrA.start_time - instrB.end_time
    })[0]
    console.log("Client::fetch apiVoucher", apiVoucher)
    console.log(apiVoucher.instrument.rights)
    console.log(apiVoucher.instrument.rights[0].additional_url_params)

    // Call cpuContract.approve(oreAccountName, cpuAmount) to designate amount to allow payment in cpu for the api call (from priceInCPU in the apiVoucher’s right for the specific endpoint desired)
    await this.orejs.approveCpu(oreAccountName, VERIFIER_ACCOUNT_NAME, apiVoucher.instrument.rights[0].price_in_cpu)

    // Call Verifier contract eos.contract(‘verifier’).then(verifierContract =>      verifierContract.issueAccessToken(apiVoucherId)) =>  url, accessToken
    /*
    const options = {
      method: 'POST',
      body: JSON.stringify({
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

    // Makes request to url with accessToken marked ore-authorization in header and returns results
    const options =  {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken
      }
    }

    const response = await fetch(url, options)
    console.log("Response", response)
    return response.json()
  }
}

module.exports = {
  Client
}
