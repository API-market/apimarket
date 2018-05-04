const fs = require('fs')
const libhoney = require('libhoney').default;

module.exports = function() {
  let honey = new libhoney({
    writeKey: "fbc35773365b479999d612934364cf06",
    dataset: "apimarketlib"
  });

  return function(req, res, next) {
    honey.sendNow({
      app: req.app,
      baseUrl: req.baseUrl,
      fresh: req.fresh,
      hostname: req.hostname,
      ip: req.ip,
      method: req.method,
      originalUrl: req.originalUrl,
      params: req.params,
      path: req.path,
      protocol: req.protocol,
      query: req.query,
      route: req.route,
      secure: req.secure,
      xhr: req.xhr
    });
    next();
  };
};
