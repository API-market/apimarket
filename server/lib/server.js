require('newrelic')
require('dotenv').config()
const analyticsEvent = require(__dirname + "/segment")
const ecc = require('eosjs-ecc')
const jwt = require('jsonwebtoken')
const sortJson = require('sort-json')
const { logError } = require('./logging')

function checkHash() {
    return async (req, res, next) => {
        let requestParams
        // Check if the hash of the request parameters matches the hash included in the ore access token issued by the verifier
        if(JSON.stringify(req.query) === JSON.stringify({})){
          requestParams = req.body
        } else{
          requestParams = req.query
        }
        
      const reqParamHash = req.reqParamHash
      try {
        const sortedReqParams = sortJson(requestParams)
    
        const hash = ecc.sha256(JSON.stringify(sortedReqParams))

        if(hash === reqParamHash){
          next()
        } else {
          throw e
        }
      } catch (e) {
        return res.status(401).json({message: "the request parameters sent to the api server are differnet from thise sent to the verifier"})
      }
    }
  }

function apiMarketRequestValidator() {
    return async (req, res, next) => {     
    try{
      if(!process.env.VERIFIER_PUBLIC_KEY){
        return res.status(401).json({message:"verifier public key not found. Pass in verifier public key as an"})
      }
      // Check if access token exists
      if(req.headers['ore-access-token']){
        const accessToken = await req.headers['ore-access-token']
        const accessTokenHash = ecc.sha256(JSON.stringify(accessToken))
        const ip = req.connection.remoteAddress || req.headers['x-forwarded-for']
        const verifierPublicKey = process.env.VERIFIER_PUBLIC_KEY.replace(/\\n/g, '\n')
        const payload = jwt.verify(accessToken, verifierPublicKey, {
            algorithms: ["ES256"]
          })
        
      // Check if the access token is valid
        if(payload){
            req.reqParamHash = payload["reqParamHash"]
            checkHash()
            next()
        } else {
            return res.status(401).json({message:"invalid api market access token"})
        }
        analyticsEvent(ip,"request details", {accessTokenHash})
      }
      else{
        return res.status(401).json({message:"api market access token not found"})
      
      }   
    }
    catch (e) {
      logError("Error", e)
    }
  }
}
  
module.exports = {
  apiMarketRequestValidator
}


