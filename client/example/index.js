//const {ApiMarketClient} = require('../index')  // uncomment for debugging
const {
  ApiMarketClient
} = require('../src/client.js')
const configFile = require("../example/apimarket_config.json");

const run = async () => {
  try {
    //Config to apimarketClient and connect to ORE blockchain
    let apimarketClient = new ApiMarketClient(configFile);
    await apimarketClient.connect()

    //specify the api to call using it's unique name registered on the ORE blockchain
    const apiName = "cloud.hadron.contest-2018-07"

    //call api - passing in the data it needs
    const params = {
      "httpBodyParams": {
        "imageurl": "jc9r05010_drz_small.jpg"
      },
      "httpUrlParams": {
        "env": "staging"
      }
    }
    const response = await apimarketClient.fetch(apiName, params)
    console.log(JSON.stringify(response, null, 2))

  } catch (error) {
    console.error(error)
  }
}

run()