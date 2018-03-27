const fs = require('fs')
const apimarket = require('../../index');

const configFilePath = '/config.json'
const config = JSON.parse(fs.readFileSync(__dirname + configFilePath))

const registrySelector = 'io.hadron.spaceTelescope'
const request = {"query":"{ spaceTelescope(image:\"https://cdn.spacetelescope.org/archives/images/thumb300y/potw1452a.jpg\") {results} }"}

const run = async () => {
  let client = await apimarket.init(config)

  let url = "http://sandbox.dev.aikon.com:3405/"
  try {
    const response = await client.fetch(url, request)
    console.log(JSON.stringify(response, null, 2))
  } catch(err) {
    console.error(err)
  }
}

run()
