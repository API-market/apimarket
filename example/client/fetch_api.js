import '@babel/polyfill'
const fs = require('fs')
const Client = require('../../lib/client');

const pathToKeyFile = './example/key.json'
const configFilePath = './example/config.json'
const apiEndpoint = 'io.hadron.spaceTelescope';

process.env.CONTRACT_ADDRESS = '0xedec26295df8a61a29aece56e36e7e2bc1d65205' // payment channel contract

(async () => {
  const config = JSON.parse(fs.readFileSync(configFilePath))
  const keys = JSON.parse(fs.readFileSync(pathToKeyFile))

  let client = await Client.init(config, keys)

  try {
    const endpoint = await client.open(config.registry[apiEndpoint])
    endpoint.fetch({x: 1})
    console.log("RESULT:", result)
  } catch(err) {
    console.log(err)
  }
})()
