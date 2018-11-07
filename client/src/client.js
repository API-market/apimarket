const fs = require('fs')
const fetch = require('node-fetch')
const Base64 = require('js-base64').Base64;
const ecc = require('eosjs-ecc')
const semver = require('semver');
const NodeCache = require("node-cache");
const accessTokenCache = new NodeCache();
const {
  log,
  encryptParams,
  getTokenAmount
} = require("./helpers.js")

var URL = require('url').URL
const {
  Orejs
} = require('@open-rights-exchange/orejs')

const engines = require('../package').engines;
const version = engines.node;

// check node version when running the client within a node application
if (process.version.length != 0) {
  if (!semver.satisfies(process.version, version)) {
    throw new Error(`Required node version ${version} not satisfied with current version ${process.version}.`);
  }
}

const VOUCHER_CATEGORY = "apimarket.apiVoucher"
const uuidv1 = require('uuid/v1');


class ApiMarketClient {
  constructor(config) {
    // config path defaults to the current working directory
    this.loadConfig(config)
  }

  //load config data from file and valiate entries
  loadConfig(config) {

    //make sure config data exists
    if (!config) {
      throw new Error(`Config data is missing. You can downloaded the file (from api.market) with the required settings for an api.`)
    }

    var {
      accountName,
      verifier,
      verifierAccountName,
      verifierAuthKey
    } = config

    var errorMessage = ''

    if (!verifierAuthKey) {
      errorMessage += `\n --> VerifierAuthKey is missing or invalid. Download the API's config file from api.market.`
    }

    //confirm other config values are present
    if (!accountName) {
      errorMessage += `\n --> Missing accountName. Download the API's config file from api.market.`
    }

    if (!verifier || !verifierAccountName) {
      errorMessage += `\n --> Missing verifier or verifierAccountName. Download the API's config file from api.market - it will include these values.`
    }

    if (errorMessage != '') {
      throw new Error(`Config file (e.g., apimarket_config.json) is missing or has bad values. ${errorMessage}`)
    }

    //decode verifierAuthKey
    try {
      config.verifierAuthKey = Base64.decode(verifierAuthKey)
    } catch (error) {

      let errMsg = `decode error: ${error.message}`
      if (error.message == 'Non-base58 character') {
        errMsg = `Problem decoding the verifierAuthKey. Make sure to download the correct config file from api.market.`
      }
      throw new Error(`${errMsg} ${error}`)
    }

    this.config = config

  }

  //connect to the ORE blockchain
  connect() {
    return new Promise((resolve, reject) => {
      (async () => {
        await this.getDetailsFromChain(reject)
        this.orejs = new Orejs({
          httpEndpoint: this.oreNetworkUri,
          chainId: this.OreChainId,
          keyProvider: [this.config.verifierAuthKey.toString()],
          oreAuthAccountName: this.config.accountName,
          sign: true
        })
        await this.checkVerifierAuthKey(this.config.accountName, this.config.verifierAuthKey, reject)
        resolve(this)

      })();
    });
  }

  async checkVerifierAuthKey(accountName, verifierAuthKey, reject) {
    try {
      // check if the verifierAuthKey belongs to the account name in the config file 
      const verifierAuthPubKey = await ecc.privateToPublic(verifierAuthKey.toString())
      const isValidKey = await this.orejs.checkPubKeytoAccount(accountName, verifierAuthPubKey)
      if (!isValidKey) {
        throw new Error(`VerifierAuthKey does not belong to the accountName. Make sure to download the correct config file from api.market.`)
      }
    } catch (error) {
      reject(error)
    }
  }

  //use verifier discovery endpoint to retrieve ORE node address and chainId
  async getDetailsFromChain(reject) {

    //get ORE blockchain URL from verifier discovery endpoint
    try {
      const oreNetworkData = await fetch(`${this.config.verifier}/discovery`)
      const {
        oreNetworkUri
      } = await oreNetworkData.json()

      if (!oreNetworkUri) {
        throw new Error()
      }
      this.oreNetworkUri = oreNetworkUri
    } catch (error) {
      const errorMessage = `Problem retrieving ORE address from verifier discovery endpoint. Config file expects a verifier running here: ${this.config.verifier}. ${error}`
      reject(errorMessage)
    }

    //get chainId from ORE blockchain
    try {
      const oreInfoEndpoint = `${this.oreNetworkUri}/v1/chain/get_info`
      const oreNetworkInfo = await fetch(oreInfoEndpoint)
      const {
        chain_id
      } = await oreNetworkInfo.json()
      if (!chain_id) {
        throw new Error()
      }
      this.OreChainId = chain_id
    } catch (error) {
      const errMsg = `Problem retrieving info from the ORE blockchain. Config file expects an ORE node running here: ${this.oreNetworkUri}. ${error}`
      reject(error)
    }
  }

  // append url/body to the parameter name to be able to distinguish b/w url and body parameters
  getParams(requestParams) {
    let params = {}
    let newKey
    if (requestParams["http-url-params"] && requestParams["http-body-params"]) {
      Object.keys(requestParams["http-url-params"]).forEach(key => {
        newKey = "urlParam_" + key
        params[newKey] = requestParams["http-url-params"][key]
      })
      Object.keys(requestParams["http-body-params"]).forEach(key => {
        newKey = "bodyParam_" + key
        params[newKey] = requestParams["http-body-params"][key]
      })
      return params
    } else {
      return requestParams
    }
  }

  async getOptions(endpoint, httpMethod, oreAccessToken, requestParameters) {
    let options
    let url
    url = new URL(endpoint)

    if (requestParameters["http-url-params"] && requestParameters["http-body-params"]) {
      Object.keys(requestParameters["http-url-params"]).forEach(key => {
        url.searchParams.append(key, requestParameters["http-url-params"][key])
      })
      options = {
        method: httpMethod,
        body: JSON.stringify(requestParameters["http-body-params"]),
        headers: {
          'Content-Type': 'application/json',
          'Ore-Access-Token': oreAccessToken
        }
      }
    } else {
      if (httpMethod.toLowerCase() === "post") {
        options = {
          method: httpMethod,
          body: JSON.stringify(requestParameters),
          headers: {
            'Content-Type': 'application/json',
            'Ore-Access-Token': oreAccessToken
          }
        }
      } else {
        options = {
          method: httpMethod,
          headers: {
            'Content-Type': 'application/json',
            'Ore-Access-Token': oreAccessToken
          }
        }
        Object.keys(requestParameters).forEach(key => url.searchParams.append(key, requestParameters[key]))
      }
    }
    return {
      url,
      options
    }
  }

  async getApiVoucherAndRight(apiName) {
    // Call orejs.findInstruments(accountName, activeOnly:true, args:{category:’apiMarket.apiVoucher’, rightName:’xxxx’}) => [apiVouchers]
    const apiVouchers = await this.orejs.findInstruments(this.config.accountName, true, VOUCHER_CATEGORY, apiName)

    // Choose one voucher - rules to select between vouchers: use cheapest priced and then with the one that has the earliest endDate
    const apiVoucher = apiVouchers.sort((a, b) => {
      const rightA = this.orejs.getRight(a, apiName)
      const rightB = this.orejs.getRight(b, apiName)
      return rightA.price_in_cpu - rightB.price_in_cpu || a.instrument.start_time - b.instrument.end_time
    })[apiVouchers.length - 1]
    const apiRight = this.orejs.getRight(apiVoucher, apiName)
    return {
      apiVoucher,
      apiRight
    }
  }

  async getAccessTokenFromVerifier(apiVoucher, apiRight, encryptedParams) {
    let errorMessage
    let result
    const signature = await this.orejs.signVoucher(apiVoucher.id)
    const options = {
      method: 'POST',
      body: JSON.stringify({
        requestParams: encryptedParams,
        rightName: apiRight.right_name,
        signature: signature,
        voucherId: apiVoucher.id
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    try {
      result = await fetch(`${this.config.verifier}/verify`, options)
      if (!result.ok) {
        let error = await result.json()
        throw new Error(error.message)
      }
    } catch (error) {
      errorMessage = "Internal Server Error"
      throw new Error(`${errorMessage}:${error.message}`)
    }

    const {
      endpoint,
      oreAccessToken,
      method,
      additionalParameters,
      accessTokenTimeout
    } = await result.json()

    if (!oreAccessToken || oreAccessToken === undefined) {
      errorMessage = "Internal Server Error: Verifier is unable to return an ORE access token. Make sure a valid voucher is passed to the verifier."
      throw new Error(`${errorMessage}`)
    }

    if (!endpoint || endpoint === undefined) {
      errorMessage = "Internal Server Error: Verifier is unable to find the Api endpoint. Make sure to pass in the correct right name you want to access."
      throw new Error(`${errorMessage}`)
    }

    return {
      endpoint,
      oreAccessToken,
      method,
      additionalParameters,
      accessTokenTimeout,
    }
  }

  async getUrlAndAccessToken(apiVoucher, apiRight, apiCallPrice, requestParams) {
    // Call Verifier to get access token
    let accessToken
    let cached
    const params = this.getParams(requestParams)
    const encryptedParams = encryptParams(params)

    var hash = require('object-hash');


    const cacheKeyParams = Object.assign({}, encryptedParams)
    cacheKeyParams["right"] = apiRight.right_name

    // key for the cached data
    const hashedCacheKey = hash(cacheKeyParams)
    const cachedAccessToken = accessTokenCache.get(hashedCacheKey)

    // check if the accesstoken can be cached
    if (apiCallPrice !== "0.0000 CPU") {
      accessToken = await this.getAccessTokenFromVerifier(apiVoucher, apiRight, encryptedParams);
      cached = false
    } else {
      // check if accesstoken for the client request exists in the cache or not 
      if (cachedAccessToken === undefined) {
        accessToken = await this.getAccessTokenFromVerifier(apiVoucher, apiRight, encryptedParams);

        // set the "time to live" for the cached token to be equal to the accessTokenTimeout of the ore-access-token
        accessTokenCache.set(hashedCacheKey, accessToken, accessToken.accessTokenTimeout)
        cached = false
      } else {
        accessToken = cachedAccessToken
        cached = true
      }
    }
    return {
      accessToken,
      cached
    }
  }


  async callApiEndpoint(endpoint, httpMethod, requestParameters, oreAccessToken) {
    // Makes request to url with accessToken marked ore-authorization in header and returns results
    try {
      const {
        url,
        options
      } = await this.getOptions(endpoint, httpMethod, oreAccessToken, requestParameters)
      const response = await fetch(url, options)
      if (response.headers.get('content-type').includes("application/json")) {
        return response.json()
      } else {
        return response.text()
      }
    } catch (error) {
      throw new Error(`Api Endpoint Error: ${error.message}`)
    }
  }

  async postUsageLog(apiVoucherId, rightName, oreAccessToken, apiCallPrice) {
    // posts the usage details for a voucher to the verifier
    // NOTE: this is called only when the API call cost is 0
    const signature = await this.orejs.signVoucher(apiVoucherId)
    const options = {
      method: 'POST',
      body: JSON.stringify({
        rightName: rightName,
        oreAccessToken: oreAccessToken,
        signature: signature,
        voucherId: apiVoucherId,
        amount: apiCallPrice
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    await fetch(`${this.config.verifier}/update-usage`, options)
  }

  async fetch(apiName, requestParams) {
    log("Fetch:", apiName)
    const {
      apiVoucher,
      apiRight
    } = await this.getApiVoucherAndRight(apiName)
    log("Voucher purchased :", apiVoucher)
    log("Right to be used :", apiRight)

    const apiCallPrice = getTokenAmount(apiRight.price_in_cpu)

    if (apiCallPrice != "0.0000 CPU") {
      // Call cpuContract.approve(accountName, cpuAmount) to designate amount to allow payment in cpu for the api call (from priceInCPU in the apiVoucher’s right for the specific endpoint desired)
      const memo = "approve CPU transfer for" + this.config.verifierAccountName + uuidv1()

      // Permission name for the account
      const authorization = "authverifier";

      await this.orejs.approveCpu(this.config.accountName, this.config.verifierAccountName, apiCallPrice, memo, authorization)
      log("CPU approved for the verifier!")
    }

    // Call the verifier to get a new access token or get the cached access token
    const {
      accessToken,
      cached
    } = await this.getUrlAndAccessToken(apiVoucher, apiRight, apiCallPrice, requestParams)

    const {
      endpoint,
      oreAccessToken,
      method,
      additionalParameters
    } = accessToken

    log("Url:", endpoint)
    log("OreAccessToken", oreAccessToken)

    // add the additional parameters returned from the verifier which are not already there in the client request to the Api provider
    if (additionalParameters && additionalParameters.length != 0) {
      Object.keys(additionalParameters).map(key => {
        requestParams[key] = additionalParameters[key]
      })
    }

    // Call the verifier to update usage log if the api call cost is 0 and client is using cached token
    if (cached === true && apiCallPrice === "0.0000 CPU") {
      this.postUsageLog(apiVoucher.id, apiRight.right_name, JSON.stringify(oreAccessToken), apiCallPrice)
    }

    // Call the api
    const response = await this.callApiEndpoint(endpoint, method, requestParams, oreAccessToken)
    return response
  }
}

module.exports = {
  ApiMarketClient
}