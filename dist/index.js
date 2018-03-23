"use strict";

require("core-js/modules/es6.array.sort");

require("core-js/modules/es7.object.values");

require("core-js/modules/es7.object.entries");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es7.string.pad-start");

require("core-js/modules/es7.string.pad-end");

const client = require('./lib/client');

const server = require('./lib/server');

const asyncHandler = require('express-async-handler'); // this function is exposed so API providers can build their own server, injecting this middleware as appropriate


exports.middlewareFor = asyncHandler(server.middlewareFor); // returns an express server ready to `listen` on a `port`

exports.initServer = server.build;
exports.init = client.init;