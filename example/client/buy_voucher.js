const fs = require('fs')
const Client = require('../../lib/client');

const pathToKeyFile = './key.json'
const configFilePath = './config.json'
const offerAddress = '0x6adfa13dd131328b704a83dc8a08b37298af7837' // For purchasing a new voucher

process.env.CONTRACT_ADDRESS = '0xf7f0e2e0682c2fabe35201b0f5a8832f3790dce1' // payment channel contract

(async () => {
  const config = JSON.parse(fs.readFileSync(configFilePath))
  const keys = JSON.parse(fs.readFileSync(pathToKeyFile))

  let client = await Client.init(config, keys)

  try {
    const voucherAddress = await client.purchase(offerAddress)
    console.log("VOUCHER ADDRESS:", voucherAddress)
  } catch(err) {
    console.log(err)
  }
})()
