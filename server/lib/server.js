require('dotenv').config()
const analyticsEvent = require(__dirname + "/segment")
const ecc = require('eosjs-ecc')
const jwt = require('jsonwebtoken')
const sortJson = require('sort-json')
const {
  logError
} = require('./logging')

function checkRequestParams(reqParamHash, requestParams) {
  // Check if the hash of the request parameters matches the hash included in the ore access token issued by the verifier
  try {
    const sortedReqParams = sortJson(requestParams)
    const hash = ecc.sha256(JSON.stringify(sortedReqParams))
    if (hash === reqParamHash) {
      return true
    } else {
      return false
    }
  } catch (error) {
    errMsf = ``
    throw new Error(`${errMsg} ${error}`);
  }
}

async function checkOreAccessToken(oreAccessToken, requestParams) {
  try {
    let errMsg;

    if (!process.env.VERIFIER_PUBLIC_KEY) {
      errMsg = `verifier public key is missing. Provide a valid verifier public key as environment variable`;
      throw new Error(`${errMsg}`);
    }

    const verifierPublicKey = process.env.VERIFIER_PUBLIC_KEY.replace(/\\n/g, '\n')

    // verify ore access token is a valid jwt token signed by the client
    const payload = await jwt.verify(oreAccessToken, verifierPublicKey, {
      algorithms: ["ES256"]
    })

    return checkRequestParams(payload.reqParamHash, requestParams)
  } catch (error) {
    errHead = `invalid ore-access-token `
    if (error.message == 'jwt expired') {
      errMsg = ` Expired ore-access-token. Provide a valid token.`
    }

    if (error.message == 'invalid signature') {
      errMsg = ` Invalid signature for ore-access-token. Make sure ore-access-token is signed with a valid key`
    }

    if (error.message == 'jwt malformed') {
      errMsg = ` Malformed ore-access-token. Make sure the ore-access-token has the valid right name and voucher.`
    }

    logError("Error", `${errHead}:${errMsg}`)
    throw new Error(`${errHead}:${errMsg}`)
  }
}

//export as a middleware
function apiMarketRequestValidator() {
  let errMsg;
  return async (req, res, next) => {
    try {
      // check if the verifier public key exists
      if (!process.env.VERIFIER_PUBLIC_KEY) {
        errMsg = `verifier public key is missing. Provide a valid verifier public key as environment variable.`;
        throw new Error(`${errMsg}`);
      }
      // Check if access token exists
      if (!req.headers['ore-access-token'] || req.headers['ore-access-token'] === undefined) {
        errMsg = `ore-access-token is missing in the request. Provide a valid ore-access-token in the request header.`;
        throw new Error(`${errMsg}`);
      }

      let requestParams = Object.assign(req.query, req.body)

      // Check if access token is valid
      let ifValid = await checkOreAccessToken(req.headers['ore-access-token'], requestParams)

      if (ifValid) {
        // record data in segment 
        const ip = req.connection.remoteAddress || req.headers['x-forwarded-for']
        const accessTokenHash = ecc.sha256(JSON.stringify(req.headers['ore-access-token']))
        analyticsEvent(ip, "request details", {
          accessTokenHash
        })
        // return the control back to next middleware
        next()
      } else {
        return res.status(401).json({
          message: "the ore-access-token is not valid"
        })
      }
    } catch (error) {
      logError("Error", error)
      return res.status(400).json({
        messge: error.message
      })
    }
  }
}

module.exports = {
  apiMarketRequestValidator,
  checkOreAccessToken
}