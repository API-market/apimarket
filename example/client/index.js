const {Client} = require('../../index')

const run = async () => {
  let client = new Client({
    httpEndpoint: "http://eos1.aikon.com:8888",
    keyFilePath: "/../example/client/keys.json",
    keyProvider: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3",
    oreAccountName: "eosio",
  })

  const url = "http://localhost:8080"
  const body = {"query":"{ spaceTelescope(image:\"https://cdn.spacetelescope.org/archives/images/thumb300y/potw1452a.jpg\") {results} }"}

  try {
    const response = await client.fetch(url, body)
    //console.log(JSON.stringify(response, null, 2))
  } catch(err) {
    console.error(err)
  }
  process.exit(0)
}

run()
