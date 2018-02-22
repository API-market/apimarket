const { instrument, capability } = require('open-rights-exchange')

exports.purchase = async (offerAddress, options) => {
  const { web3, ipfs, transactionParameters, cpuContractAddress } = options

  const offer = await instrument.at(offerAddress, {web3, ipfs})

  const [ voucherCapability ] = await instrument.exercise(offer, {web3, transactionParameters, cpuContractAddress})

  const voucher = await capability.perform(voucherCapability, {web3, ipfs, transactionParameters})

  return instrument.address(voucher)
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
