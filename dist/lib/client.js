"use strict";

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const Web3 = require('web3');

const keythereum = require('keythereum');

const utils = require('ethereumjs-util');

const PaymentChannel = require('payment-channel');

const {
  instrument,
  capability,
  contract
} = require('open-rights-exchange');

const ipfsAPI = require('ipfs-api');

const url = require('url');

const {
  fromRegistry
} = require('./server');

const connectIPFS = endpoint => {
  const ipfsurl = url.parse(endpoint);
  const ipfs = ipfsAPI({
    host: ipfsurl.hostname,
    port: ipfsurl.port,
    protocol: ipfsurl.protocol.slice(0, -1)
  });
  return ipfs;
};

const connectWeb3 = endpoint => {
  const web3Provider = new Web3.providers.HttpProvider(endpoint);
  return new Web3(web3Provider);
};

let web3;
let ipfs;
let paymentChannelInstance;
let transactionParameters;
let cpuContractAddress;

exports.init =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (config, keys, _options = {}) {
    let options = Object.assign({
      gas: 2930000,
      gasPrice: 1e9
    }, _options);
    cpuContractAddress = config.contracts.cpuContract; // sorry... for machinomy

    process.env.CONTRACT_ADDRESS = config.contracts.paymentChannel;
    process.env.ERC20CONTRACT_ADDRESS = cpuContractAddress;
    web3 = connectWeb3(config.services.web3.endpoint);
    ipfs = connectIPFS(config.services.ipfs.endpoint);
    let address;

    if (keys) {
      let privateKey = utils.bufferToHex(keythereum.recover(config.password, keys));
      let password = config.password;
      let key = yield web3.personal.importRawKey(privateKey, password);
      let unlocked = yield web3.personal.unlockAccount(key, password); // NOTE any new account that gets imported needs to be funded
      //web3.eth.sendTransaction({from: web3.eth.coinbase, to: keys.address, value: web3.toWei(10, "ether")})

      address = '0x' + keys.address;
    } else {
      address = config.address.holder;
    }

    if (!address) {
      throw new Error('need a valid Ethereum address from the configuration to begin');
    }

    transactionParameters = {
      gas: options.gas,
      gasPrice: options.gasPrice,
      from: address
    };
    paymentChannelInstance = new PaymentChannel(address, web3, "nedb", "clientDB");
    return {
      fetch: function () {
        var _ref2 = _asyncToGenerator(function* (endpoint, request) {
          const voucherAddress = fromRegistry(config, endpoint).voucher.address;
          const apiCapability = yield open(voucherAddress);
          return capability.perform(apiCapability, request);
        });

        return function fetch(_x3, _x4) {
          return _ref2.apply(this, arguments);
        };
      }()
    };
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.purchase =
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(function* (offerAddress) {
    const offer = yield instrument.at(offerAddress, {
      web3,
      ipfs
    });
    const [voucherCapability] = yield instrument.exercise(offer, {
      web3,
      transactionParameters,
      cpuContractAddress
    });
    const voucher = yield capability.perform(voucherCapability, {
      web3,
      ipfs,
      transactionParameters
    });
    return instrument.address(voucher);
  });

  return function (_x5) {
    return _ref3.apply(this, arguments);
  };
}();

const findVoucherAddress =
/*#__PURE__*/
function () {
  var _ref4 = _asyncToGenerator(function* (offerAddress, userAddress) {
    const abi = contract.abi.instrumentFactoryWithToken;
    const offer = web3.eth.contract(abi).at(offerAddress);
    const eventFilter = offer.InstrumentCreated({
      holder: userAddress
    }, {
      fromBlock: 0
    });
    const events = yield new Promise((resolve, reject) => {
      eventFilter.get((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    const event = events.slice(-1).pop();
    return event.args.instrument;
  });

  return function findVoucherAddress(_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}();

exports.load =
/*#__PURE__*/
function () {
  var _ref5 = _asyncToGenerator(function* (offerAddress, userAddress) {
    const voucherAddress = yield findVoucherAddress(offerAddress, userAddress, web3);
    return open(voucherAddress, options);
  });

  return function (_x8, _x9) {
    return _ref5.apply(this, arguments);
  };
}();

const open =
/*#__PURE__*/
function () {
  var _ref6 = _asyncToGenerator(function* (voucherAddress) {
    const voucher = yield instrument.at(voucherAddress, {
      web3,
      ipfs
    });
    const [apiCapability] = yield instrument.exercise(voucher, {
      transactionParameters,
      web3,
      paymentChannelInstance
    });
    return apiCapability;
  });

  return function open(_x10) {
    return _ref6.apply(this, arguments);
  };
}();

exports.open = open;