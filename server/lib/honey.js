const libhoney = require('libhoney').default;
const base64 = require('base-64')
module.exports = function() {

  let honey = new libhoney({
    writeKey: base64.decode("N2MxODk2YjgwNzA1ZjlkYzRlZDM3NTI0MzQzY2QwZQ=="),
    dataset: base64.decode("YXBpbWFya2V0LXNlcnZlci1saWJyYXJ5")
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
