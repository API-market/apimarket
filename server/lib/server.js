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
    throw new Error(`${errMsg} ${error}`);
  }
}

async function checkOreAccessToken(oreAccessToken, requestParams) {
  try {
    let errMsg;

    if (!process.env.VERIFIER_PUBLIC_KEY) {
      errMsg = `verifier public key is missing. Provide a valid verifier public key`;
      throw new Error(`${errMsg}`);
    }

    const verifierPublicKey = process.env.VERIFIER_PUBLIC_KEY.replace(/\\n/g, '\n')
    // verify ore access token is a valid jwt token signed by the client
    const payload = await jwt.verify(oreAccessToken, verifierPublicKey, {
      algorithms: ["ES256"]
    })
    return checkRequestParams(payload.reqParamHash, requestParams)
  } catch (error) {
    errHead = `invalid ore-access-token`
    if (error.message == 'jwt expired') {
      errMsg = `Expired ore-access-token. Provide a valid token.`
    }
    if (error.message == 'invalid signature') {
      errMsg = `invalid signature for ore-access-token. Make sure ore-access-token is signed with a valid key`
    }
    if (error.message == 'jwt malformed') {
      errMsg = `Malformed ore-access-token. Make sure the ore-access-token has the valid right name and voucher.`
    }
    logError("Error", `${errHead}:${error.message}`)
    return false
  }
}

//export as a middleware
function apiMarketRequestValidator() {
  return async (req, res, next) => {
    try {
      if (!process.env.VERIFIER_PUBLIC_KEY) {
        return res.status(400).json({
          message: "verifier public key not found. Pass in verifier public key as an environment variable."
        })
      }
      // Check if access token exists
      if (req.headers['ore-access-token']) {
        let requestParams = Object.assign(req.query, req.body)
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
            message: "the ore access token is not valid"
          })
        }
      } else {
        return res.status(400).json({
          message: "ore access token not found in the request. Pass in a valid ore access token."
        })
      }
    } catch (error) {
      logError("Error", error)
    }
  }
}

module.exports = {
  apiMarketRequestValidator,
  checkOreAccessToken
}