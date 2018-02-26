(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
const { instrument, capability, contract } = require('open-rights-exchange')

exports.purchase = async (offerAddress, options) => {
  const { web3, ipfs, transactionParameters, cpuContractAddress } = options

  const offer = await instrument.at(offerAddress, {web3, ipfs})

  const [ voucherCapability ] = await instrument.exercise(offer, {web3, transactionParameters, cpuContractAddress})

  const voucher = await capability.perform(voucherCapability, {web3, ipfs, transactionParameters})

  return instrument.address(voucher)
}

const findVoucherAddress = async (offerAddress, userAddress, web3) => {
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

exports.load = async (offerAddress, userAddress, options) => {
  const { web3 } = options

  const voucherAddress = await findVoucherAddress(offerAddress, userAddress, web3)

  return open(voucherAddress, options)
}

const open = async (voucherAddress, options) => {
  const { web3, ipfs, transactionParameters } = options

  const voucher = await instrument.at(voucherAddress, {web3, ipfs})

  const [ apiCapability ] = await instrument.exercise(voucher, {transactionParameters, web3})

  return {
    fetch: (request) => capability.perform(apiCapability, request)
  }
}
exports.open = open

},{"open-rights-exchange":2}],2:[function(require,module,exports){
const exportModule = (moduleName) => {
  const module = require(moduleName)
  exports[moduleName.slice(2)] = module
}

const modulesNames = [
  './capability',
  './condition',
  './contract',
  './instrument',
  './ipfs',
  './right',
  './verifier'
]

modulesNames.map(exportModule)

},{}]},{},[1]);
