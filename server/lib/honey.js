const libhoney = require('libhoney').default;
module.exports = function() {

  let honey = new libhoney({
    writeKey: "7c1896b80705f9dc4ed37524343cd0e",
    dataset: "apimarket-server-library"
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
