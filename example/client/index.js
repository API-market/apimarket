const fs = require('fs')
const aikon = require('../../index');

const configFilePath = '/config.json'
const config = JSON.parse(fs.readFileSync(__dirname + configFilePath))

const registrySelector = 'io.hadron.spaceTelescope'
const request = {"query":"{ DeepSpace(image:\"https://cdn.spacetelescope.org/archives/images/thumb300y/potw1452a.jpg\") {results} }"}

const run = async () => {
  let client = await aikon.init(config)

  try {
    const response = await client.fetch(registrySelector, request)
    console.log(JSON.stringify(response, null, 2))
  } catch(err) {
    console.error(err)
  }
}

run()
