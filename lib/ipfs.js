// includes ipfs utilities
const IPFS = require('ipfs-mini')
const URL = require('url-parse')

// creates a connection to an IPFS node
exports.connectIPFS = (ipfs_node) => {
    try {
        const url = new URL(ipfs_node, true)

        const protocol = url["protocol"].split(":")[0]

        ipfs = new IPFS({
            "host": url["hostname"],
            "port": url["port"],
            "protocol": protocol
        })

        return ipfs

    } catch (err) {

        //if ipfs node not running, provide our own IPFS node
        const ipfs = new IPFS({
            host: 'ipfs.infura.io',
            port: 5001,
            protocol: 'https'
        })
    }
}

// Adds data to ipfs
// ipfs: ipfs instance of the ipfs node specified by the user
// msg: data to be stored on ipfs
exports.addToIPFS = async (ipfs, msg) => new Promise((resolve, reject) => {
  ipfs.add(msg, (err, result) => {
    if (err) {
      reject(err)
    } else {
      resolve(result)
    }
  })
})

// Gets data from IPFS corresponding to the hash
exports.getFromIPFS = async (ipfs, addr) => new Promise((resolve, reject) => {
  ipfs.cat(addr, (err, result) => {
    if (err) {
      reject(err)
    } else {
      resolve(result)
    }
  })
})
