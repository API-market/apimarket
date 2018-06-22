const dotenv = require("dotenv")
const {Client} = require('../../index')

const run = async () => {
  let client = new Client({
    httpEndpoint: "http://127.0.0.1:8888",
    keyFilePath: "/../example/client/keys.json",
    keyProvider: "5JayvgDa4A5JJSxc732jfs3E9iv78rVXNPKXAeyH3Bt4t25d8cc",
    oreAccountName: "apiuser"
  })

  const apiName = "some_right_2"
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
