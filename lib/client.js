const Web3 = require('web3')
const keythereum = require('keythereum')
const utils = require('ethereumjs-util')
const IPFS = require("./ipfs")
const PaymentChannel = require('payment-channel')
const { instrument, capability, contract } = require('open-rights-exchange')

const cpuContractAddress = '0x07c72b65bef6588d1bc8bc181c0f09d19ed0adad'

let web3
let ipfs
let paymentChannelInstance
let transactionParameters

exports.init = async (keys, config, _options={}) => {
  let options = Object.assign({
    gas: 2930000,
    gasPrice: 1e9,
  }, _options)

  web3 = new Web3(new Web3.providers.HttpProvider(config.services.web3.endpoint))
  ipfs = IPFS.connectIPFS(config.services.ipfs.endpoint)

  let privateKey = utils.bufferToHex(keythereum.recover(config.password, keys))
  let password = config.password
  let key = await web3.personal.importRawKey(privateKey, password)
  let unlocked = await web3.personal.unlockAccount(key, password)
  // NOTE any new account that gets imported needs to be funded
  //web3.eth.sendTransaction({from: web3.eth.coinbase, to: keys.address, value: web3.toWei(10, "ether")})

  transactionParameters = {
    gas: options.gas,
    gasPrice: options.gasPrice,
    from: '0x' + keys.address
  }

  paymentChannelInstance = new PaymentChannel(keys.address, web3, "nedb", "clientDB")
  return this;
}

exports.purchase = async (offerAddress) => {
  const offer = await instrument.at(offerAddress, {web3, ipfs})

  const [ voucherCapability ] = await instrument.exercise(offer, {web3, transactionParameters, cpuContractAddress})

  const voucher = await capability.perform(voucherCapability, {web3, ipfs, transactionParameters})

  return instrument.address(voucher)
}

const findVoucherAddress = async (offerAddress, userAddress) => {
  // FIXME contract.abi is borked
  const abi = contract.abi.instrumentFactory
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

exports.open = async (voucherAddress) => {
  const voucher = await instrument.at(voucherAddress, {web3, ipfs})

  const [ apiCapability ] = await instrument.exercise(voucher, {transactionParameters, web3, paymentChannelInstance})

  return {
    fetch: (request) => capability.perform(apiCapability, request)
  }
}
