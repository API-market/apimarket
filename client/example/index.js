const dotenv = require("dotenv")
const {Client} = require('../index')

dotenv.config({path: './.env'})

const run = async () => {
  let client = new Client("../example/config.json");

  await client.connect()

  //api to access
  const apiName = "cloud.hadron.contest-2018-07"

  //request data
  const data = {"imageurl":"jc9r05010_drz_small.jpg"}

  try {
    const response = await client.fetch(apiName, data)
    console.log(JSON.stringify(response, null, 2))
  } catch(err) {
    console.error(err)
  }
  process.exit(0)
}

run()
