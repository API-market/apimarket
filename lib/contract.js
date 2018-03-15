const truffle = require('truffle-contract')

const truffleFor = (abi, web3) => {
  const contract = truffle(abi)

  contract.setProvider(web3.currentProvider)
  return contract
}
exports.truffleFor = truffleFor
