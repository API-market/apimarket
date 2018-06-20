const fs = require('fs')
const fetch = require('node-fetch')
const {Orejs} = require('orejs')

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

  async fetch(url, body) {
    console.log("Request:", url)
    // Call orejs.findInstruments(oreAccountName, activeOnly:true, args:{category:’apiMarket.apiVoucher’, rightName:’xxxx’}) => [apiVouchers]
    // TODO Limit vouchers by rightName
    const apiVouchers = await this.orejs.findInstruments(this.config.oreAccountName, true, 'apim.apiVoucher')

    // Choose one voucher - rules to select between vouchers: use cheapest priced and then with the one that has the earliest endDate
    const apiVoucher = apiVouchers.sort((a, b) => {
      const instrA = a["instrument"]
      const instrB = b["instrument"]
      const rightA = instrA["rights"][0]
      const rightB = instrB["rights"][0]
      return rightA["price_in_cpu"] - rightB["price_in_cpu"] || instrA["start_time"] - instrB["end_time"]
    })[0]
    console.log("Client::fetch apiVoucher", apiVoucher)

    // Call cpuContract.approve(oreAccountName, cpuAmount) to designate amount to allow payment in cpu for the api call (from priceInCPU in the apiVoucher’s right for the specific endpoint desired)
    //await this.orejs.approveCpu(oreAccountName, cpuAmount)

    // Call Verifier contract eos.contract(‘verifier’).then(verifierContract =>      verifierContract.issueAccessToken(apiVoucherId)) =>  url, accessToken
    //const verifierContract = await this.orejs.eos.contract('verifier')
    //const {url, accessToken} = await verifierContract.issueAccessToken(apiVoucher.id)
    let accessToken = ''

    // Makes request to url with accessToken marked ore-authorization in header and returns results
    const options =  {
      method: 'GET',
      //body: JSON.stringify(body),
      /*
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken
      }
      */
    }

    const response = await fetch(url, options)
    console.log("Response", response)
    //return response.json()
  }
}

module.exports = {
  Client
}
