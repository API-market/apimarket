// module contains utilities for connecting to external services
const Web3 = require('web3')
const IPFS = require('ipfs-mini')
const url = require('url')

const connectIPFS = (endpoint) => {
  const ipfsURL = url.parse(endpoint)
  const ipfs = new IPFS({
    host: ipfsURL.hostname,
    port: ipfsURL.port,
    protocol: ipfsURL.protocol.slice(0, -1)
  })
  return ipfs
}
exports.connectIPFS = connectIPFS

const connectWeb3 = (endpoint) => {
  const web3Provider = new Web3.providers.HttpProvider(endpoint)
  return new Web3(web3Provider)
}
exports.connectWeb3 = connectWeb3
