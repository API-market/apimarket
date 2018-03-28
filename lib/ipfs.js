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
