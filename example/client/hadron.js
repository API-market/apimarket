import '@babel/polyfill'
const fs = require('fs')
const http = require('http');
const Client = require('../../lib/client');

const pathToKeyFile = './example/key.json'
const configFilePath = './example/config.json'
const apiEndpoint = 'io.hadron.spaceTelescope';

process.env.CONTRACT_ADDRESS = '0xedec26295df8a61a29aece56e36e7e2bc1d65205' // payment channel contract
process.env.PORT = 8000

const config = JSON.parse(fs.readFileSync(configFilePath))
const keys = JSON.parse(fs.readFileSync(pathToKeyFile))

;(async () => {
  //const client = await Client.init(keys, config)
  console.log("Client.init()")
  //const endpoint = await client.open(config.registry[apiEndpoint])
  console.log("client.open")

  // NOTE A temporary mock for the fetching data through the AIKON protocol
  let fetch = async (data) => {
    return data.split('').reverse().join('');
  }

  http.createServer((req, res) => {
    try {
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        //endpoint.fetch(body).then((result) => {
        fetch(body).then((result) => {
          res.end(result);
        });
      });
    } catch(err) {
      res.statusCode = 404;
      res.end();
    }
  }).listen(process.env.PORT);
})()
