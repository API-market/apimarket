"use strict";

const {
  Client
} = require('./lib/client');

const server = require('./lib/server');

const asyncHandler = require('express-async-handler');

module.exports = {
  Client,
  initServer: server.build,
  middlewareFor: asyncHandler(server.middlewareFore)
};