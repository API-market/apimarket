const {
  ApiMarketClient
} = require('@apimarket/apimarket')
const configFile = require("../example/apimarket_config.json");

const run = async () => {
  try {
    //Config to apimarketClient and connect to ORE blockchain
    let apimarketClient = new ApiMarketClient(configFile);
    await apimarketClient.connect()

    //specify the api to call using it's unique name registered on the ORE blockchain
    const apiName = "cloud.hadron.imageRecognize"

    //call api - passing in the data it needs
    const params = {
      "imageurl": "https://storage.googleapis.com/partner-aikon.appspot.com/partner-hadron-transferLearning-v1-deepspace.jpg"
    }

    // use both the http-body-params and http-url-params to pass the parameters if both query and body parameters exist. Otherwise just pass the parameters to the apimarketClient.fetch directly.
    // for example - 
    // "httpBodyParams": {
    //   "imageurl": "https://console.cloud.google.com/storage/browser/apimarket-contest-2018-07-1-coffee/10465_full_jpg.jpg"
    // },
    // "httpUrlParams": {
    //   "env": "staging"
    // }

    const response = await apimarketClient.fetch(apiName, params)
    console.log(JSON.stringify(response, null, 2))

  } catch (error) {
    console.error(error)
  }
}

run()