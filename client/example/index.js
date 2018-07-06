const dotenv = require("dotenv")
const {Client} = require('../index')

dotenv.config({path: './.env'})

const run = async () => {
  let client = new Client({
    oreNetworkUri: process.env.ORE_NETWORK_URI,
    keyFilePath: process.env.KEY_FILE_PATH
  })

  const apiName = "testapi"
  const data = {"query":"{ spaceTelescope(image:\"https://cdn.spacetelescope.org/archives/images/thumb300y/potw1452a.jpg\") {results} }"}

  try {
    const response = await client.fetch(apiName, data)
    console.log(JSON.stringify(response, null, 2))
  } catch(err) {
    console.error(err)
  }
  process.exit(0)
}

run()
