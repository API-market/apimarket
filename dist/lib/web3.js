"use strict";

const Web3 = require('web3');

const connectWeb3 = endpoint => {
  const web3Provider = new Web3.providers.HttpProvider(endpoint);
  return new Web3(web3Provider);
};

exports.connectWeb3 = connectWeb3;