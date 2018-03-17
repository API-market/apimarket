const fs = require('fs')
const aikon = require('../../index');

const configFilePath = '/config.json'

const registrySelector = 'io.hadron.spaceTelescope'

const run = async () => {
  const config = JSON.parse(fs.readFileSync(__dirname + configFilePath))

  let client = await aikon.init(config)

  try {
    const response = await client.fetch(registrySelector, {x: 1})

    console.log("RESULT:", response)
  } catch(err) {
    console.error(err)
  }
}

run()
