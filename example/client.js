const fs = require('fs')
const Client = require('../lib/client');

const pathToKeyFile = './example/key.json'
const configFilePath = './example/config.json'
const offerAddress = '0xd8757e51e2fd71b0dfbd8f3dd1cdf835b3e3881b' // For purchasing a new voucher
const apiEndpoint = 'io.hadron.deepspace';

process.env.CONTRACT_ADDRESS = '0xedec26295df8a61a29aece56e36e7e2bc1d65205' // payment channel contract

;(async () => {
  const config = JSON.parse(fs.readFileSync(configFilePath))
  const keys = JSON.parse(fs.readFileSync(pathToKeyFile))

  let client = await Client.init(keys, config)
  console.log("client connected")

  try {
    const voucherAddress = await client.purchase(offerAddress)
    console.log("VOUCHER ADDRESS:", voucherAddress)
  } catch(err) {
    console.log(err)
  }

  try {
    const endpoint = await client.open(config.registry[apiEndpoint])
    endpoint.fetch({x: 1})
    console.log("RESULT:", result)
  } catch(err) {
    console.log(err)
  }
})()
