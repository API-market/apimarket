import '@babel/polyfill'
const Web3 = require('web3')
const keythereum = require('keythereum')
const utils = require('ethereumjs-util')
const PaymentChannel = require('payment-channel')
const { instrument, capability, contract } = require('open-rights-exchange')

const ipfsAPI = require('ipfs-api')
const { URL } = require('url')

const connectIPFS = (endpoint) => {
  const url = new URL(endpoint)
  const ipfs = ipfsAPI({
    host: url.hostname,
    port: url.port,
    protocol: url.protocol.slice(0, -1)
  })
  return ipfs
}

const connectWeb3 = (endpoint) => {
  const web3Provider = new Web3.providers.HttpProvider(endpoint)
  return new Web3(web3Provider)
}

let web3
let ipfs
let paymentChannelInstance
let transactionParameters
let cpuContractAddress

exports.init = async (config, keys, _options={}) => {
  let options = Object.assign({
    gas: 2930000,
    gasPrice: 1e9,
  }, _options)

  cpuContractAddress = config.contracts.cpuContract

  // sorry... for machinomy
  process.env.CONTRACT_ADDRESS = config.contracts.paymentChannel
  process.env.ERC20CONTRACT_ADDRESS = cpuContractAddress

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

  paymentChannelInstance = new PaymentChannel(address, web3, "nedb", "clientDB")

  const voucherAddress = require('./server').fromRegistry(config).voucher.address

  return await open(voucherAddress)
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

  const [ apiCapability ] = await instrument.exercise(voucher, {transactionParameters, web3, paymentChannelInstance})

  return {
    // NOTE: registrySelector is currently ignored as we only have one API in the registry
    fetch: (registrySelector, request) => capability.perform(apiCapability, request)
  }
}
exports.open = open
