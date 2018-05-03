require('newrelic')
const keythereum = require('keythereum')
const utils = require('ethereumjs-util')
const { instrument, capability, contract } = require('open-rights-exchange')
const { fromRegistry } = require('./server')
const { connectIPFS } = require('./ipfs')
const { connectWeb3 } = require('./web3')

let web3
let ipfs
let transactionParameters
let cpuContractAddress

exports.init = async (config, keys, _options={}) => {
  let options = Object.assign({
    gas: 2930000,
    gasPrice: 1e9,
  }, _options)

  cpuContractAddress = config.contracts.cpuContract

  web3 = connectWeb3(config.services.web3.endpoint)
  ipfs = connectIPFS(config.services.ipfs.endpoint)

  let address
  if (keys) {
    let privateKey = utils.bufferToHex(keythereum.recover(config.password, keys))
    let password = config.password
    let key = await web3.personal.importRawKey(privateKey, password)
    let unlocked = await web3.personal.unlockAccount(key, password)
    // NOTE any new account that gets imported needs to be funded
    //web3.eth.sendTransaction({from: web3.eth.coinbase, to: keys.address, value: web3.toWei(10, "ether")})
    address = '0x' + keys.address
  } else {
    address = config.address.holder
  }

  if (!address) {
    throw new Error('need a valid Ethereum address from the configuration to begin')
  }

  transactionParameters = {
    gas: options.gas,
    gasPrice: options.gasPrice,
    from: address
  }

  return {
    fetch: async (endpoint, request) => {
      const voucherAddress = fromRegistry(config, endpoint).voucher.address
      const apiCapability = await open(voucherAddress)

      return capability.perform(apiCapability, request)
    }
  }
}

exports.purchase = async (offerAddress) => {
  const offer = await instrument.at(offerAddress, {web3, ipfs})

  const [ voucherCapability ] = await instrument.exercise(offer, {web3, transactionParameters, cpuContractAddress})

  const voucher = await capability.perform(voucherCapability, {web3, ipfs, transactionParameters})

  return instrument.address(voucher)
}

const findVoucherAddress = async (offerAddress, userAddress) => {
  const abi = contract.abi.instrumentFactoryWithToken
  const offer = web3.eth.contract(abi).at(offerAddress)

  const eventFilter = offer.InstrumentCreated({
    holder: userAddress
  }, { fromBlock: 0 })

  const events = await new Promise((resolve, reject) => {
    eventFilter.get((err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })

  const event = events.slice(-1).pop()

  return event.args.instrument
}

exports.load = async (offerAddress, userAddress) => {
  const voucherAddress = await findVoucherAddress(offerAddress, userAddress, web3)

  return open(voucherAddress, options)
}

const open = async (voucherAddress) => {
  const voucher = await instrument.at(voucherAddress, {web3, ipfs})

  const [ apiCapability ] = await instrument.exercise(voucher, {transactionParameters, web3})

  return apiCapability
}
exports.open = open
